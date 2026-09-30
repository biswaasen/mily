const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadStore(initial = {}) {
  let data;
  const module = { exports: {} };
  const old = { groqApiKey: 'legacy-key', memories: [{ content: 'biswarup' }], messages: [{ response: 'hello' }] };
  vm.runInNewContext(fs.readFileSync('store.js', 'utf8'), {
    module,
    require(name) {
      if (name === 'electron-store') return { default: class {
        constructor(options) { assert.equal(options.name, 'mily-config'); data = { ...options.defaults, ...initial }; }
        get(key) { return data[key]; } set(key, value) { data[key] = value; }
      } };
      if (name === 'electron') return { app: { getPath: () => '/settings/mily' } };
      if (name === './services/action-prompt') return require('../services/action-prompt');
      if (name === 'crypto') return require('node:crypto');
      if (name === 'path') return path;
      if (name === 'fs') return {
        existsSync: file => file === '/settings/mily/mily-config.json',
        readFileSync: () => JSON.stringify(old),
      };
      throw new Error(name);
    },
  });
  return { api: module.exports, data: () => data };
}

test('rename imports mily key, words and history into Mily', () => {
  const { api, data } = loadStore();
  api.migrateFromLegacy();
  assert.equal(api.getGroqApiKey(), 'legacy-key');
  assert.equal(data().memories[0].content, 'biswarup');
  assert.equal(data().messages[0].response, 'hello');
});
test('existing Mily settings take precedence over legacy settings', () => {
  const { api } = loadStore({ groqApiKey: 'current-key' });
  api.migrateFromLegacy();
  assert.equal(api.getGroqApiKey(), 'current-key');
});
test('language setting persists and rejects unsupported values', () => {
  const { api } = loadStore();
  assert.equal(api.getSttLanguage(), 'auto');
  api.setSttLanguage('en');
  assert.equal(api.getSttLanguage(), 'en');
  assert.throws(() => api.setSttLanguage('invalid'), /Unsupported/);
});
test('custom prompt survives startup migration', () => {
  const prompt = 'Keep my wording and punctuation preferences.';
  const { api } = loadStore({ groqApiKey: 'current-key', systemPrompt: prompt });
  api.migrateFromLegacy();
  assert.equal(api.getSystemPrompt(), prompt);
});
test('previous built-in prompt upgrades to the new action definitions', () => {
  const source = fs.readFileSync('store.js', 'utf8');
  const legacy = source.match(/const LEGACY_SYSTEM_PROMPT = `([\s\S]*?)`;/)[1];
  const { api } = loadStore({ groqApiKey: 'current-key', systemPrompt: legacy });
  api.migrateFromLegacy();
  assert.match(api.getSystemPrompt(), /play_youtube/);
  assert.match(api.getSystemPrompt(), /search_google/);
});
