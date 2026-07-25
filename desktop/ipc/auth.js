const { shell } = require("electron");
const store = require("../store");
const windows = require("../windows");

function registerAuth(ipcMain) {
  ipcMain.on("logout", () => {
    store.clearAll();
    const input = windows.getSafeInputWindow();
    if (input && !input.isDestroyed()) input.destroy();
    const main = windows.getSafeMainWindow();
    if (main && !main.isDestroyed()) main.webContents.send("reset-app");
  });

  ipcMain.on("hide-panel", () => windows.hideMainWindow());
  ipcMain.on("toggle-panel", () => windows.toggleMainWindow());
  ipcMain.on("buddy-context-menu", () => windows.showBuddyContextMenu());
  ipcMain.on("quit-app", () => {
    windows.setQuitting(true);
    const { app } = require("electron");
    app.quit();
  });

  ipcMain.on("open-accessibility-settings", () => {
    if (process.platform === "darwin") {
      shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility");
    }
  });
}

module.exports = { registerAuth };
