const { test } = require('node:test');
const assert = require('node:assert/strict');
const { actionPolicy } = require('../services/intent-policy');

for (const speech of [
  'Insight AI is a company I want to learn about.',
  'What is Insight AI?',
  'Tell me about Insight AI.',
  'I searched Google for Insight AI yesterday.',
  'I want to play some videos later.',
  'YouTube has some MrBeast videos.',
  'Write an email asking them to search Google.',
  'He said open YouTube and play a video.',
  'Do not search Google for this.',
  'Can you explain how to search Google?',
  'Please write search about Insight AI.',
  '"Search Google for Insight AI"',
]) {
  test(`dictation stays dictation: ${speech}`, () => {
    assert.equal(actionPolicy(speech).mode, 'transcript');
    assert.deepEqual(actionPolicy(speech).allowed, []);
  });
}
for (const [speech, allowed] of [
  ['Search about Insight AI', 'search_google'],
  ['Hey, can you please search Google for Insight AI?', 'search_google'],
  ['Open Google and search about Insight AI', 'search_google'],
  ['Open YouTube and play MrBeast videos', 'play_youtube'],
  ['Open YouTube and search for MrBeast', 'search_youtube'],
  ['Play MrBeast videos', 'play_youtube'],
  ['Search YouTube for MrBeast', 'search_youtube'],
  ['Please open Slack', 'open_app'],
]) {
  test(`explicit command permits ${allowed}: ${speech}`, () => {
    assert.ok(actionPolicy(speech).allowed.includes(allowed));
  });
}
test('opening supported sites does not require a saved link or a guessed app name', () => {
  assert.equal(actionPolicy('Open Google.').directAction.url, 'https://www.google.com/');
  assert.equal(actionPolicy('Hey Mily, open YouTube').directAction.url, 'https://www.youtube.com/');
});
