const path = require("path");
const fs = require("fs");

function loadConfig() {
  let isProduction = false;
  try {
    const { app } = require("electron");
    isProduction = app && app.isPackaged;
  } catch {
    isProduction = process.env.NODE_ENV === "production";
  }

  const configFile = isProduction ? "production.config.js" : "local.config.js";

  let config;
  try {
    config = require(`./${configFile}`);
  } catch {
    const possiblePaths = [
      path.join(__dirname, configFile),
      path.join(process.resourcesPath, "app", "config", configFile),
      path.join(process.resourcesPath, "app", configFile),
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
    config = { UPDATE_URL: "" };
  }

  return {
    UPDATE_URL: config.UPDATE_URL || "",
  };
}

module.exports = { loadConfig };
