const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup({ pendingMic = false, failRequest = false } = {}) {
  const handlers = {}, sent = [], effects = [];
  let stopped = 0, recorder, releaseMic, resolveRequest;
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  const ipc = {
    on: (name, handler) => { handlers[name] = handler; }, removeListener() {},
    send: (name, data) => sent.push({ name, data }),
    invoke: async () => {
      if (failRequest) throw new Error('Provider failure');
      return new Promise(resolve => { resolveRequest = resolve; });
    },
  };
  class Recorder {
    constructor() { recorder = this; this.state = 'inactive'; }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      this.ondataavailable({ data: new Blob(['a'.repeat(6000)]) });
      this.onstop();
    }
  }
  const react = {
    useState: value => [value, () => {}], useRef: value => ({ current: value }),
    useEffect: fn => effects.push(fn), useCallback: fn => fn,
  };
  const module = { exports: {} };
  vm.runInNewContext(transformSync(fs.readFileSync('src/hooks/useAudioRecording.ts', 'utf8'), { loader: 'ts', format: 'cjs' }).code, {
    module, exports: module.exports, Blob, Uint8Array, setTimeout() {},
    require: name => name === 'react' ? react : name.includes('useIpc') ? { useIpc: () => ipc } : { MIN_HEIGHT: 2, MAX_HEIGHT: 10 },
    navigator: { mediaDevices: { getUserMedia: () => pendingMic ? new Promise(resolve => { releaseMic = () => resolve(stream); }) : Promise.resolve(stream) } },
    MediaRecorder: Recorder,
    AudioContext: class {
      state = 'running'; close() { this.state = 'closed'; }
      createAnalyser() { return {}; } createMediaStreamSource() { return { connect() {} }; }
    },
  });
  module.exports.useAudioRecording();
  effects.forEach(fn => fn());
  return { handlers, sent, stopped: () => stopped, recorder: () => recorder,
    releaseMic: () => releaseMic(), resolveRequest: value => resolveRequest(value) };
}

test('releasing Fn before microphone permission resolves prevents recording', async () => {
  const app = setup({ pendingMic: true });
  const starting = app.handlers['start-recording']({}, 'Editor');
  app.handlers['stop-recording']();
  app.releaseMic();
  await starting;
  assert.equal(app.stopped(), 1);
  assert.equal(app.recorder(), undefined);
});
test('microphone stops before a failed provider request', async () => {
  const app = setup({ failRequest: true });
  await app.handlers['start-recording']({}, 'Editor');
  app.handlers['stop-recording']();
  await flush();
  assert.equal(app.stopped(), 1);
  assert.equal(app.sent.some(event => event.name === 'http-result'), false);
});
test('Escape during processing suppresses a late result', async () => {
  const app = setup();
  await app.handlers['start-recording']({}, 'Editor');
  app.handlers['stop-recording']();
  await flush();
  app.handlers['cancel-recording']();
  app.resolveRequest({ response: 'Do not paste me', transcription: 'Do not paste me', action: null });
  await flush();
  assert.equal(app.sent.some(event => event.name === 'http-result'), false);
  assert.equal(app.stopped(), 1);
});
