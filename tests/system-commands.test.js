const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function commands() {
  const opened = [], launched = [], module = { exports: {} };
  vm.runInNewContext(fs.readFileSync('system-commands.js', 'utf8'), {
    module, URL,
    require: name => {
      if (name === 'electron') return { shell: { openExternal: async url => opened.push(url) } };
      if (name === 'child_process') return {
        exec: () => assert.fail('Shell must not receive app names'),
        execFile: (file, args, callback) => { launched.push({ file, args }); callback(); },
      };
      if (name === './services/web-actions') return require('../services/web-actions');
      return {};
    },
  });
  return { api: module.exports, opened, launched };
}
test('search command is executed in the default browser', async () => {
  const { api, opened } = commands();
  await api.executeSystemCommand({ action: 'search_google', query: 'cats & dogs' });
  assert.equal(new URL(opened[0]).searchParams.get('q'), 'cats & dogs');
});
test('opening apps passes a literal argument, not an AppleScript or shell command', async () => {
  const { api, launched } = commands();
  const name = 'App "with quotes" $(echo injected)';
  await api.executeSystemCommand({ action: 'open_app', app: name });
  assert.equal(launched[0].file, 'open');
  assert.equal(launched[0].args[1], name);
});
test('non-web URLs cannot be dispatched as saved links', async () => {
  const { api, opened } = commands();
  await assert.rejects(api.executeSystemCommand({ action: 'open_url', url: 'file:///tmp/private' }), /Only web links/);
  assert.equal(opened.length, 0);
});
