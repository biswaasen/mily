const { shell } = require("electron");
const store = require("../store");
const windows = require("../windows");
const systemCommands = require("../system-commands");

function handleAuthError() {
  store.setAuthToken(null);
  const input = windows.getSafeInputWindow();
  if (input) input.close();
  const main = windows.getSafeMainWindow();
  if (main) main.webContents.send("auth-expired");
}

function handleAuthCallback(url, config) {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    if (!token) throw new Error("No authentication token found in callback");

    store.setAuthToken(token);

    const input = windows.getSafeInputWindow();
    if (!input) {
      windows.createInputWindow();
      systemCommands.setInputWindow(windows.getInputWindow());
    } else {
      input.webContents.send("auth-success");
    }

    const main = windows.getSafeMainWindow();
    if (main) {
      main.webContents.send("auth-success");
      main.webContents.send("auth-success-message", "You have been successfully authenticated!");
    }
    windows.showMainWindow();
  } catch (error) {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send("auth-error", error.message || "Failed to process authentication. Please try again.");
  }
}

function registerAuth(ipcMain, config) {
  ipcMain.handle("get-auth-token", () => store.getAuthToken());

  ipcMain.handle("validate-session", async () => {
    const token = store.getAuthToken();
    if (!token) return { valid: false, error: "No token found", unreachable: false };
    try {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(`${config.BACKEND_URL}/api/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) return { valid: true };
      if (response.status === 401) {
        store.setAuthToken(null);
        return { valid: false, error: "Session expired", unreachable: false };
      }
      return { valid: false, error: "Server error", unreachable: false };
    } catch {
      return { valid: false, error: "Cannot reach server", unreachable: true };
    }
  });

  ipcMain.on("logout", () => {
    store.setAuthToken(null);
    store.setOnboardingCompleted(false);
    const input = windows.getSafeInputWindow();
    if (input) input.close();
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send("auth-expired");
  });

  ipcMain.on("open-login", () => {
    if (!config.LOGIN_URL) return;
    try {
      const loginUrl = new URL(config.LOGIN_URL);
      loginUrl.searchParams.set("redirect", "mily://auth");
      shell.openExternal(loginUrl.toString());
    } catch {
      shell.openExternal(config.LOGIN_URL);
    }
  });

  ipcMain.on("open-accessibility-settings", () => {
    if (process.platform === "darwin") shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility");
  });
}

module.exports = { handleAuthError, handleAuthCallback, registerAuth };
