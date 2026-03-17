const Store = require("electron-store").default;

const store = new Store({
  name: "mily-config",
  defaults: {
    auth_token: null,
    onboardingCompleted: false,
    shortcutKey: "d",
  },
});

const getAuthToken = () => store.get("auth_token");
const setAuthToken = (token) => store.set("auth_token", token);
const getOnboardingCompleted = () => store.get("onboardingCompleted");
const setOnboardingCompleted = (value) => store.set("onboardingCompleted", value);
const getShortcutKey = () => store.get("shortcutKey") || "d";
const setShortcutKey = (key) => store.set("shortcutKey", key);

module.exports = {
  getAuthToken,
  setAuthToken,
  getOnboardingCompleted,
  setOnboardingCompleted,
  getShortcutKey,
  setShortcutKey,
};
