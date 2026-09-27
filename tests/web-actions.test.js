const { test } = require('node:test');
const assert = require('node:assert/strict');
const { searchUrl, videoUrl, executeWebAction } = require('../services/web-actions');

test('search encodes punctuation and multilingual text as one query parameter', () => {
  const query = 'বাংলা & cats #1? https://example.test';
  const url = new URL(searchUrl('search_google', query));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('q'), query);
  assert.equal([...url.searchParams].length, 1);
  assert.equal(new URL(searchUrl('search_youtube', query)).searchParams.get('search_query'), query);
  assert.throws(() => searchUrl('__proto__', 'topic'));
});
test('only valid YouTube watch links become autoplay targets', () => {
  assert.equal(videoUrl('https://www.youtube.com/watch?v=abcdefghijk&list=tracking'), 'https://www.youtube.com/watch?v=abcdefghijk&autoplay=1');
  for (const href of ['javascript:alert(1)', 'https://evil.test/watch?v=abcdefghijk', 'https://www.youtube.com.evil.test/watch?v=abcdefghijk', 'https://www.youtube.com/watch?v=bad', null]) {
    assert.equal(videoUrl(href), null);
  }
});
test('Google and YouTube searches open results without resolving a video', async () => {
  for (const action of ['search_google', 'search_youtube']) {
    const opened = [];
    await executeWebAction({ action, query: 'cats' }, { openExternal: async url => opened.push(url), resolveVideo: () => assert.fail('should not resolve') });
    assert.equal(opened[0], searchUrl(action, 'cats'));
  }
});
test('playback opens the resolved video', async () => {
  const opened = [];
  await executeWebAction({ action: 'play_youtube', query: 'cats' }, {
    openExternal: async url => opened.push(url),
    resolveVideo: async () => 'https://www.youtube.com/watch?v=abcdefghijk&autoplay=1',
  });
  assert.match(opened[0], /watch\?v=abcdefghijk/);
});
test('unavailable video lookup falls back to results', async () => {
  const opened = [];
  await executeWebAction({ action: 'play_youtube', query: 'cats' }, { openExternal: async url => opened.push(url), resolveVideo: async () => null });
  assert.equal(opened[0], searchUrl('play_youtube', 'cats'));
});
test('Escape during lookup prevents the browser from opening later', async () => {
  const controller = new AbortController();
  await executeWebAction({ action: 'play_youtube', query: 'cats' }, {
    signal: controller.signal, openExternal: () => assert.fail('cancelled'),
    resolveVideo: async () => { controller.abort(); return null; },
  });
});
