const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');
const windows = require('../windows');

let updateCheckInterval = null;

function setupAutoUpdater() {
  const { loadConfig } = require('../config/config-loader');
  const config = loadConfig();
  
  if (config.UPDATE_URL) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: config.UPDATE_URL
    });
  }
  
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-not-available');
  });

  autoUpdater.on('error', (error) => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-error', error.message);
  });

  autoUpdater.on('download-progress', (progress) => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-progress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    const main = windows.getSafeMainWindow();
    if (main) main.webContents.send('update-downloaded');
  });
}

function checkForUpdates() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  autoUpdater.checkForUpdates().catch(() => {});
}

function startPeriodicUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  checkForUpdates();
  
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

function setupIpcHandlers() {
  ipcMain.handle('check-for-updates', () => {
    checkForUpdates();
  });

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate().catch(() => {});
  });

  ipcMain.on('install-update', () => {
    const { app } = require('electron');
    app.isQuitting = true;
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('get-app-version', () => {
    return autoUpdater.currentVersion.version;
  });
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  startPeriodicUpdateCheck,
  setupIpcHandlers
};

