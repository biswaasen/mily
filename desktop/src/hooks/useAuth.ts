import { useState, useEffect } from 'react';
import { useIpc } from './useIpc';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const ipcRenderer = useIpc();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const key = await ipcRenderer.invoke('get-groq-key');
        setIsAuthenticated(!!key);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const handleReset = () => setIsAuthenticated(false);

    ipcRenderer.on('reset-app', handleReset);
    return () => ipcRenderer.removeListener('reset-app', handleReset);
  }, [ipcRenderer]);

  return { isAuthenticated, checkingAuth };
};
