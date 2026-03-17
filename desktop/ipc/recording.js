const { ipcMain, globalShortcut } = require("electron");
const { exec } = require("child_process");
const windows = require("../windows");
const systemCommands = require("../system-commands");
const store = require("../store");
const keyMonitor = require("../services/key-monitor");

const activeProcessingOps = new Map();
let currentTargetApp = "";
let lastNonMilyApp = "";

function getCurrentApp(callback) {
  exec('osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'', (error, stdout) => {
    let currentApp = lastNonMilyApp;
    if (!error && stdout) {
      const detectedApp = stdout.trim();
      if (detectedApp !== "Mily" && detectedApp !== "Electron") {
        currentApp = detectedApp;
        lastNonMilyApp = detectedApp;
      }
    }
    currentTargetApp = currentApp;
    callback(currentApp);
  });
}

function registerShortcut() {
  globalShortcut.unregisterAll();
  keyMonitor.stopKeyMonitoring();

  const shortcutKey = store.getShortcutKey() || "d";
  const shortcut = `CommandOrControl+${shortcutKey}`;
  const registered = globalShortcut.register(shortcut, () => {});

  if (!registered) {
    console.error(`[Recording] Failed to register global shortcut: ${shortcut}`);
    return false;
  }

  const onToggle = () => {
    const win = windows.getSafeInputWindow();
    if (!win || win.isDestroyed()) return;
    getCurrentApp((currentApp) => win.webContents.send("toggle-recording", currentApp));
  };

  const onEsc = () => {
    const win = windows.getSafeInputWindow();
    if (win && !win.isDestroyed()) win.webContents.send("cancel-recording");
  };

  const success = keyMonitor.startKeyMonitoring(onToggle, onEsc);
  return success && registered;
}

function setupRecordingHandlers(ipcMain) {
  ipcMain.on("http-result", async (_, result) => {
    const operationId = Date.now().toString();
    activeProcessingOps.set(operationId, true);
    const input = windows.getSafeInputWindow();
    if (input) input.webContents.send("http-result", result);

    const sendComplete = () => {
      activeProcessingOps.delete(operationId);
      const win = windows.getSafeInputWindow();
      if (win) win.webContents.send("processing-complete");
    };

    try {
      const { intent, action } = result;

      if (intent === "command" && action) {
        const cmd = action;
        if (cmd.action === "open_url" && !cmd.url) throw new Error("URL is required for open_url action");
        if (cmd.action === "open_app" && !cmd.app) throw new Error("App name is required for open_app action");
        if (cmd.action === "press_key" && !cmd.key) throw new Error("Key is required for press_key action");
        if (!["open_url", "open_app", "press_key", "take_screenshot"].includes(cmd.action)) {
          throw new Error("This action is not supported.");
        }
        systemCommands.executeSystemCommand(cmd);
        sendComplete();
      } else if (action?.shouldPaste) {
        setTimeout(() => {
          if (activeProcessingOps.has(operationId)) {
            systemCommands.pasteText(result.response, currentTargetApp);
            sendComplete();
          }
        }, 300);
      } else {
        setTimeout(sendComplete, 50);
      }
    } catch (error) {
      if (input) {
        input.webContents.send("error", error.message || "Failed to process result");
        input.webContents.send("processing-complete");
      }
      activeProcessingOps.delete(operationId);
    }
  });

  ipcMain.on("cancel-processing", () => {
    activeProcessingOps.clear();
    const input = windows.getSafeInputWindow();
    if (input) input.webContents.send("processing-complete");
  });

  ipcMain.on("enable-mouse-events", () => {
    const input = windows.getSafeInputWindow();
    if (input) input.setIgnoreMouseEvents(false);
  });

  ipcMain.on("disable-mouse-events", () => {
    const input = windows.getSafeInputWindow();
    if (input) input.setIgnoreMouseEvents(true, { forward: true });
  });
}

module.exports = { getCurrentApp, registerShortcut, setupRecordingHandlers };
