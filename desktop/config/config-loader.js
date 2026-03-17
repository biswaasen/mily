const path = require("path");
const fs = require('fs');

function loadConfig() {
  let isProduction = false;
  try {
    const { app } = require('electron');
    isProduction = app && app.isPackaged;
  } catch (e) {
    isProduction = process.env.NODE_ENV === 'production' || (process.versions && process.versions.electron && !process.defaultApp);
  }
  
  const configFile = isProduction ? 'production.config.js' : 'local.config.js';
  
  let config;
  try {
    config = require(`./${configFile}`);
  } catch (error) {
    const possiblePaths = [
      path.join(__dirname, configFile),
      path.join(process.resourcesPath, 'app', 'config', configFile),
      path.join(process.resourcesPath, 'app', configFile),
    ];
    
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        delete require.cache[require.resolve(configPath)];
        config = require(configPath);
        break;
      }
    }
  }

  if (!config) {
    throw new Error(`${configFile} not found. Please create ${configFile} with BACKEND_URL and FRONTEND_URL.`);
  }

  const BACKEND_URL = config.BACKEND_URL || '';
  const FRONTEND_URL = config.FRONTEND_URL || '';
  const UPDATE_URL = config.UPDATE_URL || '';

  if (!BACKEND_URL || !FRONTEND_URL) {
    console.error(`Missing BACKEND_URL or FRONTEND_URL in ${configFile}`);
  }

  const LOGIN_URL = FRONTEND_URL ? `${FRONTEND_URL}/login` : '';

  return {
    BACKEND_URL,
    FRONTEND_URL,
    LOGIN_URL,
    UPDATE_URL
  };
}

module.exports = { loadConfig };

