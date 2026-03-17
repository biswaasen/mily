import { useState, useEffect, useCallback } from 'react';
import { useIpc } from './useIpc';

const VALID_KEYS = ['m', 'n', 'b', 's', 'd', 'g', 'h', 'u', 'o', 'k', 'l'] as const;

export const useShortcut = () => {
  const ipc = useIpc();
  const [shortcutKey, setShortcutKeyState] = useState<string>('d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    ipc.invoke('get-shortcut-key').then((key: string) => {
      if (mounted && typeof key === 'string') setShortcutKeyState(key.toLowerCase());
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [ipc]);

  useEffect(() => {
    const onUpdated = (_: unknown, key: string) => {
      if (typeof key === 'string') setShortcutKeyState(key.toLowerCase());
    };
    ipc.on('shortcut-key-updated', onUpdated);
    return () => ipc.removeListener('shortcut-key-updated', onUpdated);
  }, [ipc]);

  const updateShortcut = useCallback(async (key: string) => {
    const k = key.toLowerCase();
    if (!VALID_KEYS.includes(k as typeof VALID_KEYS[number])) return false;
    const ok = await ipc.invoke('set-shortcut-key', k);
    if (ok) setShortcutKeyState(k);
    return !!ok;
  }, [ipc]);

  const formatShortcut = useCallback(() => {
    return `Cmd + ${shortcutKey.toUpperCase()}`;
  }, [shortcutKey]);

  return { shortcutKey, updateShortcut, formatShortcut, loading, availableKeys: VALID_KEYS };
};
