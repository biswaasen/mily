const Store = require("electron-store").default;

const DEFAULT_SYSTEM_PROMPT = `You are a speech-to-text transcription assistant. Your ONLY job is to clean up the voice transcription you receive and return it as properly punctuated, grammatically correct text.

Rules:
- Return ONLY the cleaned-up transcription text. Nothing else.
- Fix filler words (um, uh, like) — remove them.
- Fix punctuation and capitalisation.
- Do NOT answer questions, do NOT add commentary, do NOT interpret commands.
- Do NOT wrap in JSON, markdown, or quotes. Just return the plain cleaned text.`;

const store = new Store({
  name: "mily-config",
  defaults: {
    onboardingCompleted: false,
    shortcutKey: "d",
    groqApiKey: null,
    userName: null,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    memories: [],
    messages: [],
  },
});

const getOnboardingCompleted = () => store.get("onboardingCompleted");
const setOnboardingCompleted = (value) => store.set("onboardingCompleted", value);
const getShortcutKey = () => store.get("shortcutKey") || "d";
const setShortcutKey = (key) => store.set("shortcutKey", key);

const getGroqApiKey = () => store.get("groqApiKey");
const setGroqApiKey = (key) => store.set("groqApiKey", key);

const getUserName = () => store.get("userName");
const setUserName = (name) => store.set("userName", name);

const getSystemPrompt = () => store.get("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
const setSystemPrompt = (prompt) => store.set("systemPrompt", prompt);
const resetSystemPrompt = () => store.set("systemPrompt", DEFAULT_SYSTEM_PROMPT);

const getMemories = () => store.get("memories") || [];
const setMemories = (memories) => store.set("memories", memories);

const getMessages = () => store.get("messages") || [];
const setMessages = (messages) => store.set("messages", messages);

const clearAll = () => {
  store.set("groqApiKey", null);
  store.set("userName", null);
  store.set("systemPrompt", DEFAULT_SYSTEM_PROMPT);
  store.set("memories", []);
  store.set("messages", []);
  store.set("onboardingCompleted", false);
};

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  getOnboardingCompleted,
  setOnboardingCompleted,
  getShortcutKey,
  setShortcutKey,
  getGroqApiKey,
  setGroqApiKey,
  getUserName,
  setUserName,
  getSystemPrompt,
  setSystemPrompt,
  resetSystemPrompt,
  getMemories,
  setMemories,
  getMessages,
  setMessages,
  clearAll,
};
