const { ipcMain } = require("electron");
const { exec } = require("child_process");
const store = require("../store");
const windows = require("../windows");
const recording = require("./recording");

const VALID_SHORTCUT_KEYS = ["m", "n", "b", "s", "d", "g", "h", "u", "o", "k", "l"];

function registerConfig(ipcMain, config) {
  ipcMain.handle("get-config", () => ({
    BACKEND_URL: config.BACKEND_URL,
    FRONTEND_URL: config.FRONTEND_URL,
    LOGIN_URL: config.LOGIN_URL,
  }));

  ipcMain.handle("get-onboarding-status", () => store.getOnboardingCompleted());
  ipcMain.handle("complete-onboarding", () => {
    store.setOnboardingCompleted(true);
    return true;
  });
  ipcMain.handle("reset-onboarding", () => {
    store.setOnboardingCompleted(false);
    return true;
  });

  ipcMain.handle("get-shortcut-key", () => store.getShortcutKey());
  ipcMain.handle("set-shortcut-key", (_, key) => {
    const k = key?.toLowerCase?.();
    if (!VALID_SHORTCUT_KEYS.includes(k)) return false;
    store.setShortcutKey(k);
    recording.registerShortcut();
    const main = windows.getSafeMainWindow();
    if (main && !main.isDestroyed()) main.webContents.send("shortcut-key-updated", k);
    const input = windows.getSafeInputWindow();
    if (input && !input.isDestroyed()) input.webContents.send("shortcut-key-updated", k);
    return true;
  });

  ipcMain.handle("test-accessibility", () => {
    if (process.platform !== "darwin") return true;
    return new Promise((resolve) => {
      exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (error) => {
        if (error) {
          store.setOnboardingCompleted(false);
          resolve(false);
        } else resolve(true);
      });
    });
  });
}

module.exports = { registerConfig };
