const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function service(chatResponse, overrides = {}) {
  const requests = [];
  const logs = [];
  const store = {
    getProviderConfig: () => ({ baseUrl: 'https://example.test/v1' }),
    getSttModel: () => 'whisper-large-v3-turbo',
    getSttLanguage: () => 'en',
    getChatModel: () => 'openai/gpt-oss-120b',
    getSystemPrompt: () => 'Return JSON.',
    getMemories: () => [{ content: 'biswarup' }],
    getLinks: () => [{ name: 'github', url: 'https://github.com' }],
    getUserName: () => '', getGroqApiKey: () => 'test-key', ...overrides,
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync('services/groq-service.js', 'utf8'), {
    module, Blob, FormData, console: { log: (...args) => logs.push(args.join(" ")) },
    require: name => name === './intent-policy' ? require('../services/intent-policy') : name === './action-prompt' ? require('../services/action-prompt') : name === './web-actions' ? require('../services/web-actions') : name === '../store' ? store : {
      findLinkByName: name => store.getLinks().find(link => link.name === name),
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith('/audio/transcriptions')) {
        return { ok: true, json: async () => ({ text: overrides.transcription || 'Hello Biswarup.' }) };
      }
      return chatResponse;
    },
  });
  return { api: module.exports, requests, logs };
}
const response = (content, finish_reason = 'stop') => ({
  ok: true, json: async () => ({ choices: [{ message: { content }, finish_reason }] }),
});

test('JSON generation failure preserves the transcript with no action', async () => {
  const { api } = service({ ok: false, status: 400, json: async () => ({ error: { code: 'json_validate_failed' } }) });
  const result = await api.processAudio(Buffer.from('audio'), 'Editor');
  assert.equal(result.response, 'Hello Biswarup.');
  assert.equal(result.action, null);
});
for (const [name, content, finish] of [
  ['malformed JSON', 'not JSON'],
  ['array', '[]'],
  ['wrong intent type', '{"intent":42,"text":"bad"}'],
  ['wrong text type', '{"intent":"transcript","text":{}}'],
  ['unknown intent', '{"intent":"delete","text":"bad"}'],
  ['truncated response', '{"intent":"open_app","app":"Safari","text":""}', 'length'],
]) {
  test(`${name} preserves dictation without executing an action`, async () => {
    const { api } = service(response(content, finish));
    const result = await api.processAudio(Buffer.from('audio'), 'Editor');
    assert.equal(result.response, 'Hello Biswarup.');
    assert.equal(result.action, null);
  });
}
test('valid saved link still resolves to its stored URL', async () => {
  const { api } = service(response('{"intent":"open_link","link":"github","text":""}'), { transcription: 'Open github' });
  const result = await api.processAudio(Buffer.from('audio'), 'Editor');
  assert.equal(result.action.url, 'https://github.com');
});
test('speech request includes vocabulary and explicit language using native multipart', async () => {
  const { api, requests } = service(response('{"intent":"transcript","text":"Hello biswarup."}'));
  assert.equal((await api.processAudio(Buffer.from('audio'), 'Editor')).response, 'Hello biswarup.');
  const body = requests[0].options.body;
  assert.equal(body.get('language'), 'en');
  assert.equal(body.get('prompt'), 'biswarup');
  assert.equal(body.get('file').name, 'audio.webm');
  assert.equal(requests[0].options.headers['Content-Type'], undefined);
  assert.equal(JSON.parse(requests[1].options.body).max_completion_tokens, 4096);
});
test('auto language leaves provider detection enabled', async () => {
  const { api, requests } = service(response('{"intent":"transcript","text":"Hello"}'), { getSttLanguage: () => 'auto' });
  await api.processAudio(Buffer.from('audio'), 'Editor');
  assert.equal(requests[0].options.body.has('language'), false);
});
test('authentication failures remain visible', async () => {
  const { api } = service({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API key' } }) });
  await assert.rejects(api.processAudio(Buffer.from('audio'), 'Editor'), /Invalid API key/);
});
for (const intent of ['search_google', 'search_youtube', 'play_youtube']) {
  test(`${intent} returns a structured action without model-supplied URLs`, async () => {
    const { api, requests } = service(response(JSON.stringify({ intent, text: '', query: 'MrBeast & friends', url: 'https://untrusted.test' })), { transcription: intent === 'play_youtube' ? 'Play MrBeast videos' : intent === 'search_youtube' ? 'Search YouTube for MrBeast' : 'Search Google for MrBeast' });
    const result = await api.processAudio(Buffer.from('audio'), 'Editor');
    assert.equal(result.action.action, intent);
    assert.equal(result.action.query, 'MrBeast & friends');
    assert.equal(result.action.url, undefined);
    assert.equal(result.response, '');
    assert.match(JSON.parse(requests[1].options.body).messages[0].content, /Available actions and response contract/);
  });
  for (const query of ['', '  ', 42, null, 'x'.repeat(2001)]) {
    test(`${intent} rejects invalid query ${String(query).slice(0, 12)}`, async () => {
      const { api } = service(response(JSON.stringify({ intent, text: '', query })));
      const result = await api.processAudio(Buffer.from('audio'), 'Editor');
      assert.equal(result.action, null);
      assert.equal(result.response, 'Hello Biswarup.');
    });
  }
}
for (const transcription of ['What is Insight AI?', 'I was searching for Insight AI.', 'Please type search Google for Insight AI']) {
  test(`model search decision cannot override dictation: ${transcription}`, async () => {
    const { api, requests } = service(response('{"intent":"search_google","text":"","query":"Insight AI"}'), { transcription });
    const result = await api.processAudio(Buffer.from('audio'), 'Editor');
    assert.equal(result.action, null);
    assert.equal(result.response, transcription);
    assert.match(JSON.parse(requests[1].options.body).messages[0].content, /Runtime mode: transcript/);
  });
}
test('normal speech still receives AI cleanup', async () => {
  const { api } = service(response('{"intent":"transcript","text":"Insight AI builds tools."}'), { transcription: 'um insight ai builds tools' });
  const result = await api.processAudio(Buffer.from('audio'), 'Editor');
  assert.equal(result.response, 'Insight AI builds tools.');
  assert.equal(result.action, null);
});
test('explicit website opening bypasses model guessing', async () => {
  const { api, requests } = service(null, { transcription: 'Open Google' });
  const result = await api.processAudio(Buffer.from('audio'), 'Editor');
  assert.equal(result.action.url, 'https://www.google.com/');
  assert.equal(requests.length, 1);
});

test('logs include transcript, model intent, final mode, and cleaned text without the API key', async () => {
  const { api, logs } = service(response('{"intent":"transcript","text":"Hello biswarup."}'));
  await api.processAudio(Buffer.from('audio'), 'Editor');
  const output = logs.join('\n');
  assert.match(output, /\[AI\] Transcription: Hello Biswarup/);
  assert.match(output, /\[Intent\] Model decision: transcript/);
  assert.match(output, /\[Intent\] Final: transcript/);
  assert.match(output, /\[AI\] Cleaned transcription: Hello biswarup/);
  assert.ok(!output.includes('test-key'));
});
