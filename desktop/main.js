const { app, screen, Menu } = require("electron");
const { loadConfig } = require("./config/config-loader");
const store = require("./store");
const windows = require("./windows");
const systemCommands = require("./system-commands");
const ipcHandlers = require("./ipc");
const updateService = require("./services/update-service");

const config = loadConfig();

function setupMenus() {
  if (process.platform !== "darwin") return;

  const appMenu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
        { type: "separator" },
        {
          label: "Show Dashboard",
          accelerator: "CmdOrCtrl+Shift+D",
          click: () => windows.showMainWindow()
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(appMenu);

  const dockMenu = Menu.buildFromTemplate([
    {
      label: "Show Dashboard",
      click: () => windows.showMainWindow()
    },
    {
      label: "Quit Mily",
      click: () => app.quit()
    }
  ]);
  app.dock.setMenu(dockMenu);
}

function initializeApp() {
  app.setName("Mily");

  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }

  app.on("second-instance", () => {
    const main = windows.getSafeMainWindow();
    if (main) {
      if (main.isMinimized()) main.restore();
      main.focus();
    }
  });

  windows.createMainWindow();
  windows.setupFileWatchers();
  ipcHandlers.registerShortcut();
  setupMenus();

  const groqApiKey = store.getGroqApiKey();
  if (groqApiKey) {
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
    windows.setQuitting(true);
    const input = windows.getSafeInputWindow();
    if (input) input.destroy();
  });

  ipcHandlers.setupIpcHandlers(config);
  updateService.setupAutoUpdater();
  updateService.setupIpcHandlers();
  updateService.startPeriodicUpdateCheck();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(initializeApp);
}

app.on("window-all-closed", () => {});

app.on("activate", () => {
  windows.showMainWindow();
});
