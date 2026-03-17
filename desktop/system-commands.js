const { clipboard, shell } = require("electron");
const { exec } = require("child_process");
const windows = require("./windows");

let inputWindowRef = null;

function setInputWindow(window) {
  inputWindowRef = window;
}

function sendError(message) {
  const win = inputWindowRef && !inputWindowRef.isDestroyed() ? inputWindowRef : windows.getSafeInputWindow();
  if (win) win.webContents.send("error", message);
}

function escapeForShell(script) {
  return script.replace(/'/g, "'\\''");
}

function safeAppName(name) {
  return (name || "").replace(/"/g, '""');
}

function pasteText(newText, targetApp) {
  clipboard.writeText(newText);

  if (!targetApp || targetApp === "Electron" || targetApp === "Mily") {
    const mainWin = windows.getSafeMainWindow();
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.executeJavaScript(`
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          const text = \`${newText.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
          const start = activeElement.selectionStart || 0;
          const end = activeElement.selectionEnd || 0;
          const currentValue = activeElement.value || '';
          const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
          activeElement.value = newValue;
          activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          activeElement.dispatchEvent(new Event('change', { bubbles: true }));
          true;
        } else {
          false;
        }
      `).then((handled) => {
        if (!handled) {
          mainWin.focus();
          setTimeout(() => {
            exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (error) => {
              if (error) sendError("Failed to paste");
            });
          }, 100);
        }
      }).catch(() => {
        sendError("Failed to paste");
      });
      return;
    }
  }

  const script = targetApp
    ? `tell application "${safeAppName(targetApp)}"
        activate
      end tell
      tell application "System Events"
        keystroke "v" using command down
      end tell`
    : `tell application "System Events" to keystroke "v" using command down`;

  exec(`osascript -e '${escapeForShell(script)}'`, (error) => {
    if (error) {
      setTimeout(() => {
        exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', () => {});
      }, 300);
    }
  });
}

const KEY_CODE_MAP = {
  enter: 36,
  return: 36,
  escape: 53,
  tab: 48,
  delete: 51,
  backspace: 51,
  up: 126,
  down: 125,
  left: 123,
  right: 124,
  home: 115,
  end: 119,
  "page up": 116,
  "page down": 121,
};

const MODIFIER_MAP = {
  command: "command down",
  shift: "shift down",
  option: "option down",
  control: "control down",
};

function pressKey(key, modifiers = []) {
  const keyName = (key || "").toLowerCase();
  const keyCode = KEY_CODE_MAP[keyName];
  const modString = modifiers.length ? " using " + modifiers.map((m) => MODIFIER_MAP[m.toLowerCase()] || m).join(" ") : "";

  let script;
  if (keyCode !== undefined) {
    script = `tell application "System Events" to key code ${keyCode}${modString}`;
  } else if (keyName === "space") {
    script = `tell application "System Events" to keystroke space${modString}`;
  } else {
    script = `tell application "System Events" to keystroke "${keyName.replace(/"/g, '""')}"${modString}`;
  }

  exec(`osascript -e '${escapeForShell(script)}'`, (error) => {
    if (error) sendError(`Failed to press key ${key}`);
  });
}

function takeScreenshot(type = "full") {
  const scripts = {
    window: `tell application "System Events"
        keystroke "4" using {command down, shift down}
        delay 0.2
        keystroke space
      end tell`,
    selection: `tell application "System Events" to keystroke "4" using {command down, shift down, control down}`,
    full: `tell application "System Events" to keystroke "3" using {command down, shift down}`,
  };
  const script = scripts[type] || scripts.full;
  exec(`osascript -e '${escapeForShell(script)}'`, (error) => {
    if (error) sendError("Failed to take screenshot");
  });
}

function executeSystemCommand(command) {
  if (command.action === "open_url") {
    if (command.url) {
      shell.openExternal(command.url).catch(() => sendError("Failed to open URL"));
    } else {
      sendError("No URL provided");
    }
    return;
  }
  if (command.action === "open_app") {
    if (command.app) {
      const script = `tell application "${safeAppName(command.app)}"
          activate
        end tell`;
      exec(`osascript -e '${escapeForShell(script)}'`, (error) => {
        if (error) sendError(`Failed to open ${command.app}. Make sure the app is installed.`);
      });
    } else {
      sendError("No app name provided");
    }
    return;
  }
  if (command.action === "press_key") {
    if (command.key) {
      pressKey(command.key, command.modifiers || []);
    } else {
      sendError("No key provided");
    }
    return;
  }
  if (command.action === "screenshot") {
    takeScreenshot(command.mode || "full");
    return;
  }
  sendError("Unknown action");
}

module.exports = {
  setInputWindow,
  pasteText,
  executeSystemCommand,
  sendError,
};
