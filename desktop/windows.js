const { BrowserWindow, screen, nativeImage } = require("electron");
const path = require("path");

let mainWindow = null;
let inputWindow = null;
let positionUpdateTimeout = null;
let isQuitting = false;

function getSafeMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function getSafeInputWindow() {
  return inputWindow && !inputWindow.isDestroyed() ? inputWindow : null;
}

function setQuitting(value) {
  isQuitting = value;
}

function createMainWindow() {
  if (getSafeMainWindow()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 1000;
  const windowHeight = 800;
  const x = Math.round((width - windowWidth) / 2);
  const y = Math.round((height - windowHeight) / 2);

  const iconPath = path.join(__dirname, "public/logo.png");
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 16 },
    backgroundColor: '#ffffff',
    resizable: true,
    show: false,
    icon: appIcon,
    title: "Mily",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("main.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function updateInputWindowPosition() {
  if (!getSafeInputWindow()) return;
  if (positionUpdateTimeout) clearTimeout(positionUpdateTimeout);
  positionUpdateTimeout = setTimeout(() => {
    const win = getSafeInputWindow();
    if (!win) return;

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width } = primaryDisplay.workAreaSize;
    const windowWidth = 480;
    const x = Math.round(primaryDisplay.workArea.x + (width - windowWidth) / 2);
    const y = Math.round(primaryDisplay.workArea.y + 10);
    win.setPosition(x, y);
  }, 100);
}

function createInputWindow() {
  if (getSafeInputWindow()) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const windowWidth = 480;
  const windowHeight = 60;
  const x = Math.round(primaryDisplay.workArea.x + (width - windowWidth) / 2);
  const y = Math.round(primaryDisplay.workArea.y + 10);

  const iconPath = path.join(__dirname, "public/logo.png");
  const appIcon = nativeImage.createFromPath(iconPath);

  inputWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
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
    title: "Mily",
    type: 'panel',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  inputWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  inputWindow.loadFile("app.html");

  inputWindow.once("ready-to-show", () => {
    updateInputWindowPosition();
    inputWindow.show();
    inputWindow.setAlwaysOnTop(true, 'pop-up-menu');
    inputWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  inputWindow.on("minimize", (event) => {
    event.preventDefault();
    inputWindow.restore();
  });

  inputWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
    }
  });

  inputWindow.on("closed", () => {
    inputWindow = null;
  });
}

function showMainWindow() {
  const win = getSafeMainWindow();
  if (win) {
    win.show();
    win.focus();
  } else {
    createMainWindow();
    mainWindow.once("ready-to-show", () => {
      mainWindow.show();
      mainWindow.focus();
    });
  }
}

function setupFileWatchers() {
  const fs = require('fs');
  const watchFiles = ['dist/app.js', 'dist/main.js'];
  watchFiles.forEach(file => {
    try {
      fs.watchFile(file, () => {
        const main = getSafeMainWindow();
        const input = getSafeInputWindow();
        if (file.includes('main.js') && main) main.reload();
        if (file.includes('app.js') && input) input.reload();
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
  showMainWindow,
  setupFileWatchers,
  setQuitting
};
