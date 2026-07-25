const Store = require("electron-store").default;

const DEFAULT_SYSTEM_PROMPT = `You are a voice intent router for a desktop assistant.

Given what the user said (transcription), decide ONE intent and reply with ONLY a JSON object (no markdown, no extra text):

{"intent":"transcript"|"open_link"|"open_app","text":"...","link":"...","app":"..."}

Rules:
1) intent=open_link when the user wants to open a saved link (e.g. "open my github", "open gcp logs", "play that youtube", "open spotify playlist").
   - Set "link" to the exact link NAME from the Saved links list (case-insensitive match is ok; pick the best match).
   - Set "text" to "".
2) intent=open_app when they want to open a macOS app by name (e.g. "open Slack", "open Spotify") and it is NOT a saved link.
   - Set "app" to the app name. Set "text" to "".
3) intent=transcript for everything else (dictation / typing into the current app).
   - Clean the transcription: fix punctuation, capitalization, remove fillers (um, uh).
   - Apply User words for spellings, names, Hindi/English terms.
   - Return the cleaned text in "text". Leave link/app empty.
4) Never invent URLs. For open_link you may ONLY use names from Saved links.
5) If they say open/play but nothing matches Saved links and it is not clearly an app, use transcript with cleaned text.`;

const DEFAULT_PROVIDER = "groq";
const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_STT_MODEL = "whisper-large-v3-turbo";

const PROVIDERS = {
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    keyHint: "gsk_…",
    keyUrl: "https://console.groq.com/keys",
    chatModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "qwen/qwen3-32b",
    ],
    sttModels: ["whisper-large-v3-turbo", "whisper-large-v3"],
  },
};

const store = new Store({
  name: "mickey-config",
  defaults: {
    onboardingCompleted: false,
    shortcutKey: "d",
    groqApiKey: null,
    provider: DEFAULT_PROVIDER,
    chatModel: DEFAULT_CHAT_MODEL,
    sttModel: DEFAULT_STT_MODEL,
    userName: null,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    memories: [],
    links: [],
    messages: [],
    buddyPosition: null,
  },
});

function migrateFromLegacy() {
  try {
    if (store.get("groqApiKey")) return;
    const { app } = require("electron");
    const fs = require("fs");
    const path = require("path");
    const userData = app.getPath("userData");
    const candidates = [
      path.join(userData, "mily-config.json"),
      path.join(userData, "..", "mily", "mily-config.json"),
      path.join(userData, "..", "Mily", "mily-config.json"),
      path.join(userData, "..", "Electron", "mily-config.json"),
    ];
    for (const oldPath of candidates) {
      if (!fs.existsSync(oldPath)) continue;
      const old = JSON.parse(fs.readFileSync(oldPath, "utf8"));
      [
        "groqApiKey", "provider", "chatModel", "sttModel", "userName", "systemPrompt",
        "memories", "links", "messages", "buddyPosition", "onboardingCompleted", "shortcutKey",
      ].forEach((k) => {
        if (old[k] !== undefined && old[k] !== null) store.set(k, old[k]);
      });
      if (store.get("groqApiKey")) break;
    }
  } catch (_) {}
}

const getOnboardingCompleted = () => store.get("onboardingCompleted");
const setOnboardingCompleted = (value) => store.set("onboardingCompleted", value);
const getShortcutKey = () => store.get("shortcutKey") || "d";
const setShortcutKey = (key) => store.set("shortcutKey", key);

const getGroqApiKey = () => store.get("groqApiKey");
const setGroqApiKey = (key) => store.set("groqApiKey", key);

const getProvider = () => store.get("provider") || DEFAULT_PROVIDER;
const setProvider = (id) => {
  if (!PROVIDERS[id]) return getProvider();
  store.set("provider", id);
  const cfg = PROVIDERS[id];
  if (!cfg.chatModels.includes(getChatModel())) store.set("chatModel", cfg.chatModels[0]);
  if (!cfg.sttModels.includes(getSttModel())) store.set("sttModel", cfg.sttModels[0]);
  return id;
};

const getChatModel = () => store.get("chatModel") || DEFAULT_CHAT_MODEL;
const setChatModel = (model) => store.set("chatModel", model);

const getSttModel = () => store.get("sttModel") || DEFAULT_STT_MODEL;
const setSttModel = (model) => store.set("sttModel", model);

const getProviderConfig = () => PROVIDERS[getProvider()] || PROVIDERS.groq;
const listProviders = () => Object.values(PROVIDERS).map(({ id, label, keyHint, keyUrl, chatModels, sttModels }) => ({
  id, label, keyHint, keyUrl, chatModels, sttModels,
}));

const getUserName = () => store.get("userName");
const setUserName = (name) => store.set("userName", name);

const getSystemPrompt = () => store.get("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
const setSystemPrompt = (prompt) => store.set("systemPrompt", prompt);
const resetSystemPrompt = () => store.set("systemPrompt", DEFAULT_SYSTEM_PROMPT);

const getMemories = () => store.get("memories") || [];
const setMemories = (memories) => store.set("memories", memories);

const getLinks = () => store.get("links") || [];
const setLinks = (links) => store.set("links", links);

const getMessages = () => store.get("messages") || [];
const setMessages = (messages) => store.set("messages", messages);

const getBuddyPosition = () => store.get("buddyPosition");
const setBuddyPosition = (pos) => store.set("buddyPosition", pos);

const clearAll = () => {
  store.set("groqApiKey", null);
  store.set("provider", DEFAULT_PROVIDER);
  store.set("chatModel", DEFAULT_CHAT_MODEL);
  store.set("sttModel", DEFAULT_STT_MODEL);
  store.set("userName", null);
  store.set("systemPrompt", DEFAULT_SYSTEM_PROMPT);
  store.set("memories", []);
  store.set("links", []);
  store.set("messages", []);
  store.set("onboardingCompleted", false);
};

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_PROVIDER,
  DEFAULT_CHAT_MODEL,
  DEFAULT_STT_MODEL,
  PROVIDERS,
  getOnboardingCompleted,
  setOnboardingCompleted,
  getShortcutKey,
  setShortcutKey,
  getGroqApiKey,
  setGroqApiKey,
  getProvider,
  setProvider,
  getChatModel,
  setChatModel,
  getSttModel,
  setSttModel,
  getProviderConfig,
  listProviders,
  getUserName,
  setUserName,
  getSystemPrompt,
  setSystemPrompt,
  resetSystemPrompt,
  getMemories,
  setMemories,
  getLinks,
  setLinks,
  getMessages,
  setMessages,
  getBuddyPosition,
  setBuddyPosition,
  clearAll,
  migrateFromLegacy,
};
