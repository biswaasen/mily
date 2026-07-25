import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link2, History, Type, Copy, Check, Plus, X, ExternalLink, Settings, Eye, EyeOff,
} from 'lucide-react';
import { useIpc } from '../../hooks/useIpc';

type Tab = 'history' | 'links' | 'words' | 'settings';

interface ProviderInfo {
  id: string;
  label: string;
  keyHint: string;
  keyUrl: string;
  chatModels: string[];
  sttModels: string[];
}

interface LinkItem { id: string; name: string; url: string }
interface Memory { id: string; content: string }
interface Msg {
  id: string;
  query?: string;
  response?: string;
  transcription?: string;
  action?: { action?: string; url?: string; linkName?: string; app?: string } | null;
}

export const Panel: React.FC = () => {
  const ipc = useIpc();
  const [tab, setTab] = useState<Tab>('settings');
  const [ready, setReady] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [keyHint, setKeyHint] = useState<'idle' | 'saving' | 'saved' | 'invalid'>('idle');
  const [hasKey, setHasKey] = useState(false);

  const [provider, setProvider] = useState('groq');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [chatModel, setChatModel] = useState('');
  const [sttModel, setSttModel] = useState('');

  const [prompt, setPrompt] = useState('');
  const [promptHint, setPromptHint] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedKey = useRef<string | null>(null);
  const lastSavedPrompt = useRef<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [wordDraft, setWordDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeProvider = providers.find((p) => p.id === provider) || providers[0];

  const refresh = useCallback(async () => {
    try {
      const [settings, msgs, lnks, mems, sysPrompt] = await Promise.all([
        ipc.invoke('get-provider-settings'),
        ipc.invoke('get-messages', 1, 30),
        ipc.invoke('get-links'),
        ipc.invoke('get-memories'),
        ipc.invoke('get-system-prompt'),
      ]);
      if (settings) {
        const key = typeof settings.apiKey === 'string' ? settings.apiKey : '';
        setApiKey(key);
        lastSavedKey.current = key.trim();
        setHasKey(!!key);
        if (settings.provider) setProvider(settings.provider);
        if (Array.isArray(settings.providers)) setProviders(settings.providers);
        if (settings.chatModel) setChatModel(settings.chatModel);
        if (settings.sttModel) setSttModel(settings.sttModel);
      }
      if (typeof sysPrompt === 'string') {
        setPrompt(sysPrompt);
        lastSavedPrompt.current = sysPrompt;
      }
      setMessages(msgs?.messages || []);
      setLinks(Array.isArray(lnks) ? [...lnks].reverse() : []);
      setMemories(Array.isArray(mems) ? [...mems].reverse() : []);
    } catch {}
    finally { setReady(true); }
  }, [ipc]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const onReset = () => {
      setHasKey(false);
      setApiKey('');
      lastSavedKey.current = '';
      setTab('settings');
      refresh();
    };
    ipc.on('reset-app', onReset);
    return () => {
      window.removeEventListener('focus', onFocus);
      ipc.removeListener('reset-app', onReset);
    };
  }, [refresh, ipc]);

  useEffect(() => {
    if (!ready) return;
    setTab(hasKey ? 'history' : 'settings');
  }, [ready]); // only on first ready

  useEffect(() => {
    if (!ready) return;
    const value = apiKey.trim();
    if (lastSavedKey.current === null) {
      lastSavedKey.current = value;
      return;
    }
    if (value === lastSavedKey.current) return;
    if (!value) return;
    setKeyHint('saving');
    setKeyError(false);
    const t = setTimeout(async () => {
      try {
        const valid = await ipc.invoke('verify-groq-key', value);
        if (!valid) {
          setKeyError(true);
          setKeyHint('invalid');
          return;
        }
        await ipc.invoke('set-groq-key', value);
        await ipc.invoke('ensure-buddy').catch(() => {});
        await ipc.invoke('complete-onboarding').catch(() => {});
        lastSavedKey.current = value;
        setHasKey(true);
        setKeyHint('saved');
        setTimeout(() => setKeyHint('idle'), 1000);
      } catch {
        setKeyError(true);
        setKeyHint('invalid');
      }
    }, 650);
    return () => clearTimeout(t);
  }, [apiKey, ready, ipc]);

  useEffect(() => {
    if (!ready) return;
    const value = prompt.trim();
    if (lastSavedPrompt.current === null) {
      lastSavedPrompt.current = value;
      return;
    }
    if (value === lastSavedPrompt.current) return;
    if (!value) return;
    setPromptHint('saving');
    const t = setTimeout(async () => {
      try {
        await ipc.invoke('set-system-prompt', value);
        lastSavedPrompt.current = value;
        setPromptHint('saved');
        setTimeout(() => setPromptHint('idle'), 1000);
      } catch {
        setPromptHint('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [prompt, ready, ipc]);

  const addLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    await ipc.invoke('add-link', linkName.trim(), linkUrl.trim());
    setLinkName('');
    setLinkUrl('');
    const lnks = await ipc.invoke('get-links');
    setLinks(Array.isArray(lnks) ? [...lnks].reverse() : []);
  };

  const removeLink = async (id: string) => {
    await ipc.invoke('delete-link', id);
    setLinks((l) => l.filter((x) => x.id !== id));
  };

  const addWord = async () => {
    if (!wordDraft.trim()) return;
    await ipc.invoke('add-memory', wordDraft.trim());
    setWordDraft('');
    const mems = await ipc.invoke('get-memories');
    setMemories(Array.isArray(mems) ? [...mems].reverse() : []);
  };

  const removeWord = async (id: string) => {
    await ipc.invoke('delete-memory', id);
    setMemories((m) => m.filter((x) => x.id !== id));
  };

  const copyText = async (id: string, text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const changeProvider = async (id: string) => {
    const next = await ipc.invoke('set-provider', id);
    setProvider(next || id);
    const settings = await ipc.invoke('get-provider-settings');
    if (settings?.chatModel) setChatModel(settings.chatModel);
    if (settings?.sttModel) setSttModel(settings.sttModel);
    if (Array.isArray(settings?.providers)) setProviders(settings.providers);
  };

  const changeChatModel = async (model: string) => {
    setChatModel(model);
    await ipc.invoke('set-chat-model', model);
  };

  const changeSttModel = async (model: string) => {
    setSttModel(model);
    await ipc.invoke('set-stt-model', model);
  };

  const resetPrompt = async () => {
    const next = await ipc.invoke('reset-system-prompt');
    if (typeof next === 'string') {
      setPrompt(next);
      lastSavedPrompt.current = next.trim();
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'history', label: 'History', icon: <History size={12} /> },
    { id: 'links', label: 'Links', icon: <Link2 size={12} /> },
    { id: 'words', label: 'Words', icon: <Type size={12} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={12} /> },
  ];

  return (
    <div style={s.shell}>
      <div style={s.header}>
        <div style={s.tabs}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <button type="button" style={s.close} onClick={() => ipc.send('hide-panel')} aria-label="Close">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div style={s.body}>
        {tab === 'history' && (
          <div style={s.stack}>
            {messages.length === 0 && (
              <p style={s.empty}>{hasKey ? 'Hold Fn to speak' : 'Add an API key in Settings to start'}</p>
            )}
            {messages.map((m) => {
              const text = m.response || m.transcription || m.query || '';
              const isAction = !!m.action?.action;
              return (
                <div key={m.id} style={s.card}>
                  <div style={s.cardMeta}>
                    <span style={s.badge}>
                      {isAction
                        ? m.action?.action === 'open_url'
                          ? m.action.linkName || 'link'
                          : m.action?.app || 'app'
                        : 'typed'}
                    </span>
                    <button type="button" style={s.iconBtn} disabled={!text} onClick={() => copyText(m.id, text)}>
                      {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p style={s.cardText}>
                    {isAction ? (m.transcription || 'command') : (text || m.transcription || '—')}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'links' && (
          <div style={s.stack}>
            <div style={s.row}>
              <input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="name" style={{ ...s.input, flex: 0.38 }} />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" style={s.input} onKeyDown={(e) => e.key === 'Enter' && addLink()} />
              <button type="button" style={s.small} onClick={addLink} disabled={!linkName.trim() || !linkUrl.trim()}>
                <Plus size={13} />
              </button>
            </div>
            {links.length === 0 && <p style={s.empty}>No links</p>}
            {links.map((l) => (
              <div key={l.id} style={s.listRow}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={s.linkName}>{l.name}</div>
                  <div style={s.linkUrl}>{l.url}</div>
                </div>
                <button type="button" style={s.iconBtn} onClick={() => window.open(l.url, '_blank')}>
                  <ExternalLink size={12} />
                </button>
                <button type="button" style={s.iconBtn} onClick={() => removeLink(l.id)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'words' && (
          <div style={s.stack}>
            <div style={s.row}>
              <input value={wordDraft} onChange={(e) => setWordDraft(e.target.value)} placeholder="spelling or word" style={s.input} onKeyDown={(e) => e.key === 'Enter' && addWord()} />
              <button type="button" style={s.small} onClick={addWord} disabled={!wordDraft.trim()}>
                <Plus size={13} />
              </button>
            </div>
            <div style={s.chips}>
              {memories.length === 0 && <span style={s.empty}>No words</span>}
              {memories.map((m) => (
                <span key={m.id} style={s.chip}>
                  {m.content}
                  <button type="button" style={s.chipX} onClick={() => removeWord(m.id)} aria-label="Remove">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={s.settings}>
            <section style={s.section}>
              <label style={s.label}>Provider</label>
              <select value={provider} onChange={(e) => changeProvider(e.target.value)} style={s.select}>
                {(providers.length ? providers : [{ id: 'groq', label: 'Groq' }]).map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </section>

            <section style={s.section}>
              <div style={s.labelRow}>
                <label style={s.label}>API key</label>
                <span style={s.hint}>
                  {keyHint === 'saving' ? 'saving…' : keyHint === 'saved' ? 'saved' : keyHint === 'invalid' ? 'invalid' : (
                    activeProvider?.keyUrl ? (
                      <a href={activeProvider.keyUrl} target="_blank" rel="noreferrer" style={s.linkOut}>
                        get key
                      </a>
                    ) : null
                  )}
                </span>
              </div>
              <div style={s.row}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setKeyError(false); setKeyHint('idle'); }}
                  placeholder={activeProvider?.keyHint || 'gsk_…'}
                  style={{ ...s.input, ...(keyError ? s.inputErr : {}) }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  style={s.iconBtn}
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </section>

            <div style={s.modelRow}>
              <section style={{ ...s.section, flex: 1, minWidth: 0 }}>
                <label style={s.label}>Voice</label>
                <select value={sttModel} onChange={(e) => changeSttModel(e.target.value)} style={s.select}>
                  {(activeProvider?.sttModels || [sttModel].filter(Boolean)).map((m) => (
                    <option key={m} value={m}>{shortModel(m)}</option>
                  ))}
                </select>
              </section>
              <section style={{ ...s.section, flex: 1, minWidth: 0 }}>
                <label style={s.label}>Chat</label>
                <select value={chatModel} onChange={(e) => changeChatModel(e.target.value)} style={s.select}>
                  {(activeProvider?.chatModels || [chatModel].filter(Boolean)).map((m) => (
                    <option key={m} value={m}>{shortModel(m)}</option>
                  ))}
                </select>
              </section>
            </div>

            <section style={{ ...s.section, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={s.labelRow}>
                <label style={s.label}>Prompt</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={s.hint}>
                    {promptHint === 'saving' ? 'saving…' : promptHint === 'saved' ? 'saved' : ''}
                  </span>
                  <button type="button" style={s.textBtn} onClick={resetPrompt}>default</button>
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={s.textarea}
                spellCheck={false}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

function shortModel(id: string) {
  const parts = id.split('/');
  return parts[parts.length - 1];
}

const s: Record<string, React.CSSProperties> = {
  shell: {
    position: 'relative',
    height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.82)', color: '#f4f4f5',
    backdropFilter: 'blur(28px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    WebkitAppRegion: 'drag', overflow: 'hidden',
  } as React.CSSProperties,
  header: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 10px 0 10px',
  },
  close: {
    WebkitAppRegion: 'no-drag',
    flexShrink: 0,
    width: 28, height: 28, border: 'none', borderRadius: 0,
    background: 'transparent', color: 'rgba(255,255,255,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, lineHeight: 1,
  } as React.CSSProperties,
  tabs: {
    WebkitAppRegion: 'no-drag', display: 'flex', gap: 3, flex: 1, minWidth: 0,
  } as React.CSSProperties,
  tab: {
    flex: 1, height: 30, borderRadius: 8, border: '1px solid transparent',
    background: 'transparent', color: 'rgba(255,255,255,0.38)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontSize: 10, fontWeight: 500, cursor: 'pointer', padding: '0 2px', minWidth: 0,
  },
  tabActive: {
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  body: {
    WebkitAppRegion: 'no-drag', flex: 1, overflowY: 'auto', padding: '12px 12px 14px',
    minHeight: 0, display: 'flex', flexDirection: 'column',
  } as React.CSSProperties,
  settings: {
    display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  modelRow: { display: 'flex', gap: 8 },
  labelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  stack: { display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.32)' },
  label: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)',
  },
  select: {
    width: '100%', height: 32, padding: '0 8px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.9)', fontSize: 11, outline: 'none',
  },
  textarea: {
    width: '100%', flex: 1, minHeight: 120, padding: 10, borderRadius: 10, resize: 'none',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.88)', fontSize: 11, lineHeight: 1.45, outline: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    boxSizing: 'border-box',
  },
  textBtn: {
    border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.42)',
    fontSize: 10, cursor: 'pointer', padding: 0, textTransform: 'lowercase',
  },
  linkOut: { fontSize: 10, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
  hint: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  row: { display: 'flex', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, minWidth: 0, height: 32, padding: '0 10px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.9)', fontSize: 12, outline: 'none',
  },
  inputErr: { borderColor: 'rgba(248,113,113,0.55)' },
  small: {
    height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)',
    fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 4, flexShrink: 0,
  },
  primary: {
    height: 34, marginTop: 8, borderRadius: 8, border: 'none', background: '#f4f4f5', color: '#111',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },
  card: {
    padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.28)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  cardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: 'rgba(255,255,255,0.4)',
  },
  cardText: { margin: 0, fontSize: 12, lineHeight: 1.45, color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  iconBtn: {
    width: 26, height: 26, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  listRow: {
    display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', borderRadius: 10,
    background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.05)',
  },
  linkName: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)' },
  linkUrl: { fontSize: 10, color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 6px 4px 10px',
    borderRadius: 999, background: 'rgba(0,0,0,0.32)', border: '1px solid rgba(255,255,255,0.05)',
    fontSize: 11, color: 'rgba(255,255,255,0.8)',
  },
  chipX: {
    width: 16, height: 16, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0,
  },
  error: { margin: 0, fontSize: 11, color: 'rgba(252,165,165,0.95)' },
};
