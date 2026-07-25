const { BrowserWindow, screen, nativeImage, Menu } = require("electron");
const path = require("path");
const store = require("./store");

let mainWindow = null;
let inputWindow = null;
let positionUpdateTimeout = null;
let isQuitting = false;
let blurHideTimer = null;
let suppressBlurHideUntil = 0;
let panelGotFocus = false;

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 480;
const BUDDY_WIDTH = 56;
const BUDDY_HEIGHT = 26;

function getSafeMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function getSafeInputWindow() {
  return inputWindow && !inputWindow.isDestroyed() ? inputWindow : null;
}

function setQuitting(value) {
  isQuitting = value;
}

function clampBuddyPosition(x, y, display = screen.getPrimaryDisplay()) {
  const { x: workX, y: workY, width: workW, height: workH } = display.workArea;
  return {
    x: Math.round(Math.max(workX + 4, Math.min(x, workX + workW - BUDDY_WIDTH - 4))),
    y: Math.round(Math.max(workY + 4, Math.min(y, workY + workH - BUDDY_HEIGHT - 4))),
  };
}

function defaultBuddyPosition() {
  const d = screen.getPrimaryDisplay();
  const { x: workX, y: workY, width: workW } = d.workArea;
  return clampBuddyPosition(workX + workW - BUDDY_WIDTH - 20, workY + 16, d);
}

function resolveBuddyPosition() {
  const saved = store.getBuddyPosition();
  if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
    return clampBuddyPosition(saved.x, saved.y, screen.getDisplayNearestPoint(saved));
  }
  return defaultBuddyPosition();
}

function getBuddyBounds() {
  const win = getSafeInputWindow();
  if (!win) return null;
  const b = win.getBounds();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
}

function moveBuddy(x, y) {
  const win = getSafeInputWindow();
  if (!win) return null;
  const pos = clampBuddyPosition(x, y, screen.getDisplayNearestPoint({ x, y }));
  win.setPosition(pos.x, pos.y, false);
  return pos;
}

function saveBuddyPosition() {
  const win = getSafeInputWindow();
  if (!win) return;
  const [x, y] = win.getPosition();
  store.setBuddyPosition({ x, y });
}

function positionPanelNearBuddy() {
  const win = getSafeMainWindow();
  if (!win) return;
  const buddy = getBuddyBounds();
  const anchor = buddy || resolveBuddyPosition();
  const display = screen.getDisplayNearestPoint({ x: anchor.x, y: anchor.y });
  const { x: workX, y: workY, width: workW, height: workH } = display.workArea;

  let x = Math.round(anchor.x + (buddy ? buddy.width / 2 : 0) - PANEL_WIDTH / 2);
  let y = Math.round(anchor.y + (buddy ? buddy.height : BUDDY_HEIGHT) + 8);
  if (y + PANEL_HEIGHT > workY + workH - 8) y = Math.round(anchor.y - PANEL_HEIGHT - 8);

  x = Math.max(workX + 8, Math.min(x, workX + workW - PANEL_WIDTH - 8));
  y = Math.max(workY + 4, Math.min(y, workY + workH - PANEL_HEIGHT - 8));
  win.setPosition(x, y, false);
}

function createMainWindow() {
  if (getSafeMainWindow()) return;

  const iconPath = path.join(__dirname, "public/logo.png");
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    icon: appIcon,
    title: "",
    type: "panel",
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile("main.html");

  mainWindow.on("focus", () => {
    panelGotFocus = true;
  });

  mainWindow.on("blur", () => {
    if (isQuitting) return;
    if (Date.now() < suppressBlurHideUntil) return;
    // Panel windows often never take focus on show — don't auto-hide until
    // the user has actually focused the panel at least once this open.
    if (!panelGotFocus) return;
    if (blurHideTimer) clearTimeout(blurHideTimer);
    blurHideTimer = setTimeout(() => {
      blurHideTimer = null;
      if (isQuitting || Date.now() < suppressBlurHideUntil || !panelGotFocus) return;
      const win = getSafeMainWindow();
      if (!win || !win.isVisible()) return;
      const buddy = getSafeInputWindow();
      if (buddy && !buddy.isDestroyed() && buddy.isFocused()) return;
      if (!win.isFocused()) win.hide();
    }, 150);
  });
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on("closed", () => { mainWindow = null; });
}

function openPanel() {
  const win = getSafeMainWindow();
  if (!win) return;
  if (blurHideTimer) clearTimeout(blurHideTimer);
  panelGotFocus = false;
  suppressBlurHideUntil = Date.now() + 800;
  positionPanelNearBuddy();
  win.show();
  win.focus();
}

function toggleMainWindow() {
  const win = getSafeMainWindow();
  if (!win) {
    createMainWindow();
    mainWindow.once("ready-to-show", () => openPanel());
    return;
  }
  if (win.isVisible()) {
    if (blurHideTimer) clearTimeout(blurHideTimer);
    win.hide();
  } else {
    openPanel();
  }
}

function showMainWindow() {
  const win = getSafeMainWindow();
  if (win) {
    openPanel();
  } else {
    createMainWindow();
    mainWindow.once("ready-to-show", () => openPanel());
  }
}

function hideMainWindow() {
  if (blurHideTimer) clearTimeout(blurHideTimer);
  panelGotFocus = false;
  const win = getSafeMainWindow();
  if (win) win.hide();
}

function updateInputWindowPosition() {
  if (!getSafeInputWindow()) return;
  if (positionUpdateTimeout) clearTimeout(positionUpdateTimeout);
  positionUpdateTimeout = setTimeout(() => {
    const win = getSafeInputWindow();
    if (!win) return;
    const { x, y } = resolveBuddyPosition();
    win.setBounds({ x, y, width: BUDDY_WIDTH, height: BUDDY_HEIGHT });
  }, 100);
}

function showBuddyContextMenu() {
  const win = getSafeInputWindow();
  if (!win) return;
  const menu = Menu.buildFromTemplate([
    { label: "Open", click: () => showMainWindow() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        setQuitting(true);
        require("electron").app.quit();
      },
    },
  ]);
  menu.popup({ window: win });
}

function createInputWindow() {
  if (getSafeInputWindow()) return;
  const { x, y } = resolveBuddyPosition();
  const iconPath = path.join(__dirname, "public/logo.png");
  const appIcon = nativeImage.createFromPath(iconPath);

  inputWindow = new BrowserWindow({
    width: BUDDY_WIDTH,
    height: BUDDY_HEIGHT,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    closable: false,
    show: false,
    icon: appIcon,
    title: "",
    type: "panel",
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  inputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  inputWindow.loadFile("app.html");

  inputWindow.once("ready-to-show", () => {
    updateInputWindowPosition();
    inputWindow.show();
    inputWindow.setAlwaysOnTop(true, "pop-up-menu");
    inputWindow.setIgnoreMouseEvents(false);
  });

  inputWindow.on("minimize", (event) => {
    event.preventDefault();
    inputWindow.restore();
  });
  inputWindow.on("close", (event) => {
    if (!isQuitting) event.preventDefault();
  });
  inputWindow.on("closed", () => { inputWindow = null; });
}

function setupFileWatchers() {
  const fs = require("fs");
  ["dist/app.js", "dist/main.js"].forEach((file) => {
    try {
      fs.watchFile(file, () => {
        const main = getSafeMainWindow();
        const input = getSafeInputWindow();
        if (file.includes("main.js") && main) main.reload();
        if (file.includes("app.js") && input) input.reload();
      });
    } catch (_) {}
  });
}

module.exports = {
  getMainWindow: () => mainWindow,
  getInputWindow: () => inputWindow,
  getSafeMainWindow,
  getSafeInputWindow,
  createMainWindow,
  createInputWindow,
  updateInputWindowPosition,
  moveBuddy,
  saveBuddyPosition,
  getBuddyBounds,
  showMainWindow,
  hideMainWindow,
  toggleMainWindow,
  showBuddyContextMenu,
  setupFileWatchers,
  setQuitting,
};
