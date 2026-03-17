import { useState, useEffect, useRef } from 'react';
import { useIpc } from './useIpc';

export const useAutoUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const ipcRenderer = useIpc();
  const downloadingRef = useRef(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      downloadingRef.current = true;
      setUpdateAvailable(true);
      setUpdateError(null);
    };

    const handleUpdateDownloaded = () => {
      downloadingRef.current = false;
      setUpdateDownloaded(true);
      setUpdateAvailable(false);
      setUpdateError(null);
      setDownloadProgress(100);
    };

    const handleUpdateProgress = (_: any, progress: { percent: number }) => {
      setDownloadProgress(Math.round(progress.percent));
    };

    const handleUpdateError = (_: any, error: string) => {
      if (downloadingRef.current) return;
      setUpdateError(error);
      setUpdateAvailable(false);
    };

    const handleUpdateNotAvailable = () => {
      downloadingRef.current = false;
      setUpdateAvailable(false);
      setUpdateError(null);
    };

    ipcRenderer.on('update-available', handleUpdateAvailable);
    ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
    ipcRenderer.on('update-progress', handleUpdateProgress);
    ipcRenderer.on('update-error', handleUpdateError);
    ipcRenderer.on('update-not-available', handleUpdateNotAvailable);

    return () => {
      ipcRenderer.removeListener('update-available', handleUpdateAvailable);
      ipcRenderer.removeListener('update-downloaded', handleUpdateDownloaded);
      ipcRenderer.removeListener('update-progress', handleUpdateProgress);
      ipcRenderer.removeListener('update-error', handleUpdateError);
      ipcRenderer.removeListener('update-not-available', handleUpdateNotAvailable);
    };
  }, [ipcRenderer]);

  const installUpdate = () => {
    ipcRenderer.send('install-update');
  };

  const checkForUpdates = () => {
    ipcRenderer.invoke('check-for-updates');
  };

  const dismiss = () => {
    setUpdateError(null);
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    updateDownloaded,
    downloadProgress,
    updateError,
    installUpdate,
    checkForUpdates,
    dismiss,
  };
};
