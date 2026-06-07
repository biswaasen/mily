const { ipcMain } = require("electron");
const windows = require("../windows");
const systemCommands = require("../system-commands");
const auth = require("./auth");
const recording = require("./recording");
const config = require("./config");
const store = require("../store");
const groqService = require("../services/groq-service");
const localMemory = require("../services/local-memory");
const localMessages = require("../services/local-messages");

function setupIpcHandlers(configObj) {
  systemCommands.setInputWindow(windows.getInputWindow());

  // Migrate stale system prompts to the new default
  const currentPrompt = store.getSystemPrompt();
  if (currentPrompt && (currentPrompt.includes("ALWAYS respond with ONLY the JSON object") || currentPrompt.includes("CRITICAL: Output ONLY the JSON object"))) {
    store.resetSystemPrompt();
  }

  auth.registerAuth(ipcMain);
  recording.setupRecordingHandlers(ipcMain);
  config.registerConfig(ipcMain, configObj);

  ipcMain.handle("get-target-app", () => new Promise((resolve) => recording.getCurrentApp(resolve)));

  ipcMain.handle("process-audio", async (_, { audioData, context }) => {
    try {
      const buffer = Buffer.from(audioData);
      const result = await groqService.processAudio(buffer, context);
      localMessages.addMessage(result);
      return result;
    } catch (err) {
      console.error("[process-audio] Error:", err.message || err);
      throw err;
    }
  });

  ipcMain.handle("verify-groq-key", async (_, key) => {
    return groqService.verifyApiKey(key);
  });

  ipcMain.handle("get-groq-key", () => store.getGroqApiKey());
  ipcMain.handle("set-groq-key", (_, key) => {
    store.setGroqApiKey(key);
    return true;
  });

  ipcMain.handle("get-user-name", () => store.getUserName());
  ipcMain.handle("set-user-name", (_, name) => {
    store.setUserName(name);
    return true;
  });

  ipcMain.handle("get-system-prompt", () => store.getSystemPrompt());
  ipcMain.handle("set-system-prompt", (_, prompt) => {
    store.setSystemPrompt(prompt);
    return true;
  });
  ipcMain.handle("reset-system-prompt", () => {
    store.resetSystemPrompt();
    return store.getSystemPrompt();
  });

  ipcMain.handle("get-memories", () => localMemory.getMemories());
  ipcMain.handle("add-memory", (_, content) => localMemory.addMemory(content));
  ipcMain.handle("delete-memory", (_, id) => localMemory.deleteMemory(id));

  ipcMain.handle("get-messages", (_, page, limit) => localMessages.getMessages(page, limit));
  ipcMain.handle("clear-messages", () => {
    localMessages.clearMessages();
    return true;
  });
}

module.exports = {
  setupIpcHandlers,
  registerShortcut: recording.registerShortcut,
};
