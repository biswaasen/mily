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
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
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
          { role: "selectAll" },
        ],
      },
    ])
  );
}

function initializeApp() {
  app.setName("mickey");
  store.migrateFromLegacy();

  if (process.platform === "darwin" && app.dock) app.dock.hide();

  app.on("second-instance", () => windows.showMainWindow());

  windows.createMainWindow();
  windows.setupFileWatchers();
  ipcHandlers.registerShortcut();
  setupMenus();

  const groqApiKey = store.getGroqApiKey();
  windows.createInputWindow();
  systemCommands.setInputWindow(windows.getInputWindow());
  if (!groqApiKey) windows.showMainWindow();

  screen.on("display-added", () => windows.updateInputWindowPosition());
  screen.on("display-removed", () => windows.updateInputWindowPosition());
  screen.on("display-metrics-changed", () => windows.updateInputWindowPosition());

  app.on("will-quit", () => {
    const { globalShortcut } = require("electron");
    globalShortcut.unregisterAll();
    require("./services/key-monitor").stopKeyMonitoring();
    require("./services/fn-listener").stopFnListener();
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
app.on("activate", () => windows.showMainWindow());
