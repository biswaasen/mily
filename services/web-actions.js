const PROVIDERS = {
  search_google: ['https://www.google.com/search', 'q'],
  search_youtube: ['https://www.youtube.com/results', 'search_query'],
  play_youtube: ['https://www.youtube.com/results', 'search_query'],
};

function searchUrl(intent, query) {
  if (!Object.hasOwn(PROVIDERS, intent) || typeof query !== 'string' || !query.trim() || query.length > 2000) {
    throw new Error('Invalid search request');
  }
  const [base, key] = PROVIDERS[intent];
  const url = new URL(base);
  url.searchParams.set(key, query.trim());
  return url.toString();
}

function videoUrl(href) {
  try {
    const url = new URL(href);
    const id = url.searchParams.get('v');
    if (url.protocol !== 'https:' || url.hostname !== 'www.youtube.com' || url.pathname !== '/watch' || !/^[\w-]{11}$/.test(id || '')) return null;
    return `https://www.youtube.com/watch?v=${id}&autoplay=1`;
  } catch { return null; }
}

// Remote pages never share the privileged app renderer or its persistent session.
async function firstYoutubeVideo(resultsUrl, signal) {
  const { BrowserWindow } = require('electron');
  if (signal?.aborted) return null;
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, partition: 'mily-video-search' },
  });
  win.webContents.setAudioMuted(true);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const close = () => { if (!win.isDestroyed()) win.destroy(); };
  signal?.addEventListener('abort', close, { once: true });
  const timer = setTimeout(close, 12000);
  try {
    await win.loadURL(resultsUrl);
    // Read a visible video-result link; never execute model-supplied JavaScript.
    const href = await win.webContents.executeJavaScript(`new Promise(resolve => {
      const started = Date.now();
      const check = () => {
        const link = document.querySelector('ytd-video-renderer a#video-title[href*="/watch?"]');
        if (link) return resolve(link.href);
        if (Date.now() - started > 6000) return resolve(null);
        setTimeout(check, 250);
      };
      check();
    })`);
    return videoUrl(href);
  } catch { return null; }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', close);
    close();
  }
}

async function executeWebAction(action, { signal, openExternal, resolveVideo = firstYoutubeVideo }) {
  const url = searchUrl(action.action, action.query);
  let target = url;
  if (action.action === 'play_youtube') target = await resolveVideo(url, signal) || url;
  if (signal?.aborted) return;
  await openExternal(target);
}

module.exports = { searchUrl, videoUrl, firstYoutubeVideo, executeWebAction };
