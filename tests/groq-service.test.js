const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function service(chatResponse, overrides = {}) {
  const requests = [];
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
    module, Blob, FormData, console: { log() {} },
    require: name => name === '../store' ? store : {
      findLinkByName: name => store.getLinks().find(link => link.name === name),
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith('/audio/transcriptions')) {
        return { ok: true, json: async () => ({ text: 'Hello Biswarup.' }) };
      }
      return chatResponse;
    },
  });
  return { api: module.exports, requests };
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
  const { api } = service(response('{"intent":"open_link","link":"github","text":""}'));
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
