const { ipcMain } = require("electron");
const windows = require("../windows");
const systemCommands = require("../system-commands");
const auth = require("./auth");
const recording = require("./recording");
const config = require("./config");
const store = require("../store");
const groqService = require("../services/groq-service");
const localMemory = require("../services/local-memory");
const localLinks = require("../services/local-links");
const localMessages = require("../services/local-messages");

function setupIpcHandlers(configObj) {
  systemCommands.setInputWindow(windows.getInputWindow());

  // Force migrate to intent-router prompt
  const currentPrompt = store.getSystemPrompt();
  if (
    !currentPrompt ||
    currentPrompt.includes("transcription assistant") ||
    currentPrompt.includes("ALWAYS respond with ONLY the JSON") ||
    currentPrompt.includes("CRITICAL: Output ONLY the JSON") ||
    !currentPrompt.includes("intent router")
  ) {
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

  ipcMain.handle("verify-groq-key", async (_, key) => groqService.verifyApiKey(key));
  ipcMain.handle("get-groq-key", () => store.getGroqApiKey());
  ipcMain.handle("set-groq-key", (_, key) => {
    store.setGroqApiKey(key);
    const existing = windows.getSafeInputWindow();
    if (!existing || existing.isDestroyed()) {
      windows.createInputWindow();
      systemCommands.setInputWindow(windows.getInputWindow());
    }
    return true;
  });

  ipcMain.handle("ensure-buddy", () => {
    const existing = windows.getSafeInputWindow();
    if (!existing || existing.isDestroyed()) {
      windows.createInputWindow();
      systemCommands.setInputWindow(windows.getInputWindow());
    }
    return true;
  });

  ipcMain.handle("get-provider-settings", () => ({
    provider: store.getProvider(),
    chatModel: store.getChatModel(),
    sttModel: store.getSttModel(),
    providers: store.listProviders(),
    apiKey: store.getGroqApiKey() || "",
  }));
  ipcMain.handle("set-provider", (_, id) => {
    store.setProvider(id);
    return store.getProvider();
  });
  ipcMain.handle("set-chat-model", (_, model) => {
    store.setChatModel(model);
    return true;
  });
  ipcMain.handle("set-stt-model", (_, model) => {
    store.setSttModel(model);
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

  ipcMain.handle("get-links", () => localLinks.getLinks());
  ipcMain.handle("add-link", (_, name, url) => localLinks.addLink(name, url));
  ipcMain.handle("delete-link", (_, id) => localLinks.deleteLink(id));

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
