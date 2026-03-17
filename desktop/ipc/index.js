const { ipcMain } = require("electron");
const windows = require("../windows");
const systemCommands = require("../system-commands");
const auth = require("./auth");
const recording = require("./recording");
const config = require("./config");

function setupIpcHandlers(configObj) {
  systemCommands.setInputWindow(windows.getInputWindow());

  auth.registerAuth(ipcMain, configObj);
  recording.setupRecordingHandlers(ipcMain);

  ipcMain.handle("get-target-app", () => new Promise((resolve) => recording.getCurrentApp(resolve)));

  config.registerConfig(ipcMain, configObj);
}

module.exports = {
  setupIpcHandlers,
  registerShortcut: recording.registerShortcut,
  handleAuthError: auth.handleAuthError,
  handleAuthCallback: auth.handleAuthCallback,
};
