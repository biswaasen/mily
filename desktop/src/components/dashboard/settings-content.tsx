import React, { useState, useEffect } from 'react';
import { useShortcut } from '../../hooks/useShortcut';
import { useIpc } from '../../hooks/useIpc';

export const SettingsContent: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-6">
    <h1 className="text-3xl font-garamond font-medium text-neutral-900 mb-6 tracking-tight">
      Settings
    </h1>
    <ApiKeySection />
    <SystemPromptSection />
    <ShortcutSection />
    <ModesInfoSection />
  </div>
);

function ApiKeySection() {
  const ipcRenderer = useIpc();
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    ipcRenderer.invoke('get-groq-key').then((key: string | null) => {
      if (key) setApiKey(key);
    }).catch(() => {});
  }, [ipcRenderer]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setStatus('idle');
    try {
      const valid = await ipcRenderer.invoke('verify-groq-key', apiKey.trim());
      if (!valid) {
        setStatus('error');
        return;
      }
      await ipcRenderer.invoke('set-groq-key', apiKey.trim());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h2 className="text-sm font-garamond font-semibold text-neutral-900">Groq API Key</h2>
      </div>
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-garamond text-neutral-500">
          Your key is stored locally and never sent anywhere except Groq's API.{' '}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-900 underline underline-offset-2"
          >
            Get a key →
          </a>
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm font-mono text-neutral-900 placeholder:text-neutral-400"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-colors disabled:opacity-50 focus:outline-none"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {status === 'saved' && (
          <p className="text-xs font-garamond text-green-700">API key saved successfully.</p>
        )}
        {status === 'error' && (
          <p className="text-xs font-garamond text-red-600">Invalid API key. Please check and try again.</p>
        )}
      </div>
    </div>
  );
}

function SystemPromptSection() {
  const ipcRenderer = useIpc();
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ipcRenderer.invoke('get-system-prompt').then((p: string) => {
      if (p) setPrompt(p);
    }).catch(() => {});
  }, [ipcRenderer]);

  const handleSave = async () => {
    if (!prompt.trim()) return;
    setSaving(true);
    try {
      await ipcRenderer.invoke('set-system-prompt', prompt.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    try {
      const defaultPrompt = await ipcRenderer.invoke('reset-system-prompt');
      setPrompt(defaultPrompt);
    } catch {}
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h2 className="text-sm font-garamond font-semibold text-neutral-900">System Prompt</h2>
        <button
          onClick={handleReset}
          className="text-xs font-garamond text-neutral-500 hover:text-neutral-900 underline underline-offset-2 focus:outline-none"
        >
          Reset to default
        </button>
      </div>
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-garamond text-neutral-500">
          Customise how Mily responds. The system prompt defines the AI's behaviour and personality.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 text-sm font-garamond text-neutral-900 placeholder:text-neutral-400 resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-colors disabled:opacity-50 focus:outline-none"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && (
            <p className="text-xs font-garamond text-green-700">Saved successfully.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShortcutSection() {
  const { shortcutKey, updateShortcut, loading, availableKeys } = useShortcut();
  const [selectedKey, setSelectedKey] = useState(shortcutKey);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) setSelectedKey(shortcutKey);
  }, [shortcutKey, loading]);

  const handleKeyChange = async (key: string) => {
    setSelectedKey(key);
    setSaving(true);
    const ok = await updateShortcut(key);
    setSaving(false);
    if (!ok) setSelectedKey(shortcutKey);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h2 className="text-sm font-garamond font-semibold text-neutral-900">Shortcut</h2>
      </div>
      <div className="px-4 py-4">
        <p className="text-xs font-garamond text-neutral-500 mb-4">
          Key used with Cmd to start and stop recording.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-neutral-900 text-white font-mono text-sm font-semibold">
            Cmd
          </span>
          <span className="text-neutral-400 font-mono text-lg">+</span>
          {availableKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyChange(key)}
              disabled={saving || loading}
              className={`px-4 py-2 rounded-lg font-mono text-sm font-semibold transition-all focus:outline-none ${
                selectedKey === key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              } ${saving || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        {saving && (
          <p className="text-xs font-garamond text-neutral-500 mt-2">Saving...</p>
        )}
      </div>
    </div>
  );
}

function ModesInfoSection() {
  const { formatShortcut } = useShortcut();
  const shortcut = formatShortcut();

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h2 className="text-sm font-garamond font-semibold text-neutral-900">Recording</h2>
      </div>
      <div className="px-4 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-900 rounded border border-neutral-200">
              {shortcut}
            </kbd>
          </div>
          <p className="text-sm font-garamond text-neutral-900 font-semibold leading-relaxed">
            Press <kbd className="px-2 py-1 text-sm font-bold bg-neutral-900 text-white rounded">{shortcut}</kbd> to start recording, then press <kbd className="px-2 py-1 text-sm font-bold bg-neutral-900 text-white rounded">{shortcut}</kbd> again to stop. Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 text-neutral-900 rounded border border-neutral-200">Esc</kbd> to cancel.
          </p>
        </div>
      </div>
    </div>
  );
}
