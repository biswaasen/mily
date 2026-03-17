const { app, screen, Menu } = require("electron");
const path = require("path");
const { loadConfig } = require("./config/config-loader");
const store = require("./store");
const windows = require("./windows");
const systemCommands = require("./system-commands");
const ipcHandlers = require("./ipc");
const updateService = require("./services/update-service");

const config = loadConfig();

let pendingAuthUrl = null;

function setupDockMenu() {
  if (process.platform !== "darwin") return;

  const dockMenu = Menu.buildFromTemplate([
    {
      label: "Show Dashboard",
      click: () => {
        windows.showMainWindow();
      }
    },
    {
      label: "Quit Mily",
      click: () => {
        app.quit();
      }
    }
  ]);
  
  app.dock.setMenu(dockMenu);
}

function processAuthUrl(url) {
  if (!url) return;
  
  if (app.isReady()) {
    ipcHandlers.handleAuthCallback(url, config);
  } else {
    pendingAuthUrl = url;
  }
}

function initializeApp() {
  app.setName("Mily");
  
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }
  
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("mily", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient("mily");
  }

  app.on("open-url", (event, url) => {
    event.preventDefault();
    processAuthUrl(url);
  });

  app.on("second-instance", (event, commandLine) => {
    const url = commandLine.find(arg => arg.startsWith("mily://"));
    if (url) processAuthUrl(url);
    const main = windows.getSafeMainWindow();
    if (main) {
      if (main.isMinimized()) main.restore();
      main.focus();
    }
  });

  windows.createMainWindow();
  windows.setupFileWatchers();
  ipcHandlers.registerShortcut();
  setupDockMenu();
  
  const authToken = store.getAuthToken();
  if (authToken) {
    windows.createInputWindow();
    systemCommands.setInputWindow(windows.getInputWindow());
  }

  screen.on("display-added", () => {
    windows.updateInputWindowPosition();
  });

  screen.on("display-removed", () => {
    windows.updateInputWindowPosition();
  });

  screen.on("display-metrics-changed", () => {
    windows.updateInputWindowPosition();
  });

  app.on("will-quit", () => {
    const { globalShortcut } = require("electron");
    globalShortcut.unregisterAll();
    const keyMonitor = require("./services/key-monitor");
    keyMonitor.stopKeyMonitoring();
  });

  app.on("before-quit", () => {
    const main = windows.getSafeMainWindow();
    if (main) main.removeAllListeners('close');
  });

  ipcHandlers.setupIpcHandlers(config);
  updateService.setupAutoUpdater();
  updateService.setupIpcHandlers();
  updateService.startPeriodicUpdateCheck();

  if (pendingAuthUrl) {
    processAuthUrl(pendingAuthUrl);
    pendingAuthUrl = null;
  }

  const protocolUrl = process.argv.find(arg => arg.startsWith("mily://"));
  if (protocolUrl) {
    processAuthUrl(protocolUrl);
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(initializeApp);
}

app.on("window-all-closed", () => {
});

app.on("activate", () => {
  windows.showMainWindow();
});
