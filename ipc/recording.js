const { exec } = require("child_process");
const windows = require("../windows");
const systemCommands = require("../system-commands");
const keyMonitor = require("../services/key-monitor");
const fnListener = require("../services/fn-listener");

const activeProcessingOps = new Map();
let currentTargetApp = "";
let lastExternalApp = "";
let holdArmed = false;

function getCurrentApp(callback) {
  exec(
    'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'',
    (error, stdout) => {
      let currentApp = lastExternalApp;
      if (!error && stdout) {
        const detectedApp = stdout.trim();
        if (!systemCommands.isSelfApp(detectedApp)) {
          currentApp = detectedApp;
          lastExternalApp = detectedApp;
        }
      }
      currentTargetApp = currentApp;
      callback(currentApp);
    }
  );
}

function sendToInput(channel, ...args) {
  const win = windows.getSafeInputWindow();
  if (win && !win.isDestroyed()) win.webContents.send(channel, ...args);
}

function registerShortcut() {
  keyMonitor.stopKeyMonitoring();

  try {
    keyMonitor.startKeyMonitoring(() => {}, () => sendToInput("cancel-recording"));
  } catch (_) {}

  return fnListener.startFnListener({
    down: () => {
      holdArmed = true;
      getCurrentApp((currentApp) => {
        if (!holdArmed) return;
        sendToInput("start-recording", currentApp);
      });
    },
    up: () => {
      holdArmed = false;
      sendToInput("stop-recording");
    },
    interrupted: () => {
      holdArmed = false;
      sendToInput("cancel-recording");
    },
  });
}

function setupRecordingHandlers(ipcMainRef) {
  ipcMainRef.on("http-result", async (_, result) => {
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
      const action = result?.action;
      if (action && (action.action === "open_url" || action.action === "open_app")) {
        systemCommands.executeSystemCommand(action);
        setTimeout(sendComplete, 80);
        return;
      }

      if (result.response) {
        setTimeout(() => {
          if (activeProcessingOps.has(operationId)) {
            // Paste into whatever is frontmost now (user may have switched apps mid-hold)
            systemCommands.pasteText(result.response);
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

  ipcMainRef.on("cancel-processing", () => {
    activeProcessingOps.clear();
    const input = windows.getSafeInputWindow();
    if (input) input.webContents.send("processing-complete");
  });

  ipcMainRef.on("enable-mouse-events", () => {
    const input = windows.getSafeInputWindow();
    if (input) input.setIgnoreMouseEvents(false);
  });

  ipcMainRef.on("disable-mouse-events", () => {
    const input = windows.getSafeInputWindow();
    if (input) input.setIgnoreMouseEvents(true, { forward: true });
  });

  ipcMainRef.handle("get-buddy-bounds", () => windows.getBuddyBounds());
  ipcMainRef.on("move-buddy", (_, { x, y }) => windows.moveBuddy(x, y));
  ipcMainRef.on("save-buddy-position", () => windows.saveBuddyPosition());
}

module.exports = { getCurrentApp, registerShortcut, setupRecordingHandlers };
