const iohook = require("iohook-macos");
const store = require("../store");

const KEY_CODES = {
  m: 46,
  n: 45,
  b: 11,
  s: 1,
  d: 2,
  g: 5,
  h: 4,
  u: 32,
  o: 31,
  k: 40,
  l: 37,
};
const ESC_KEY = 53;

let isMonitoring = false;
let toggleCallback = null;
let escCallback = null;
let isKeyPressed = false;

function checkPermissions() {
  const permissions = iohook.checkAccessibilityPermissions();
  if (!permissions.hasPermissions) {
    iohook.requestAccessibilityPermissions();
    return false;
  }
  return true;
}

function handleKeyDown(event) {
  const targetKey = store.getShortcutKey() || "d";
  const targetKeyCode = KEY_CODES[targetKey.toLowerCase()] ?? KEY_CODES.d;
  const isCmdPressed = Boolean(
    event.modifiers?.command ?? event.modifiers?.meta ?? event.metaKey ?? false
  );
  const isTargetKey = event.keyCode === targetKeyCode;

  if (isCmdPressed && isTargetKey && !isKeyPressed) {
    isKeyPressed = true;
    if (toggleCallback) toggleCallback();
  }

  if (event.keyCode === ESC_KEY && escCallback) escCallback();
}

function handleKeyUp(event) {
  const targetKey = store.getShortcutKey() || "d";
  const targetKeyCode = KEY_CODES[targetKey.toLowerCase()] ?? KEY_CODES.d;
  if (event.keyCode === targetKeyCode) isKeyPressed = false;
}

function startKeyMonitoring(toggleHandler, escHandler) {
  if (isMonitoring) return true;
  if (!checkPermissions()) return false;

  toggleCallback = toggleHandler;
  escCallback = escHandler;
  isMonitoring = true;
  isKeyPressed = false;

  iohook.on("keyDown", handleKeyDown);
  iohook.on("keyUp", handleKeyUp);

  try {
    iohook.startMonitoring();
    return true;
  } catch (error) {
    console.error("[Key Monitor] Failed to start:", error.message);
    return false;
  }
}

function stopKeyMonitoring() {
  if (!isMonitoring) return;

  iohook.stopMonitoring();
  iohook.removeAllListeners("keyDown");
  iohook.removeAllListeners("keyUp");

  isMonitoring = false;
  isKeyPressed = false;
  toggleCallback = null;
  escCallback = null;
}

module.exports = {
  startKeyMonitoring,
  stopKeyMonitoring,
  isMonitoring: () => isMonitoring,
  checkPermissions,
};
