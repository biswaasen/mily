import React, { useState, useEffect } from 'react';
import { useShortcut } from '../../hooks/useShortcut';

export const SettingsContent: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-6">
    <h1 className="text-3xl font-garamond font-medium text-neutral-900 mb-6 tracking-tight">
      Settings
    </h1>
    <ShortcutSection />
    <ModesInfoSection />
  </div>
);

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
