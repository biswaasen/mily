import { useState, useEffect } from 'react';
import { useIpc } from './useIpc';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const ipcRenderer = useIpc();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await ipcRenderer.invoke('get-auth-token');
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const handleAuthSuccess = async () => {
      const token = await ipcRenderer.invoke('get-auth-token');
      setIsAuthenticated(!!token);
    };

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
    };

    ipcRenderer.on('auth-success', handleAuthSuccess);
    ipcRenderer.on('auth-expired', handleAuthExpired);

    return () => {
      ipcRenderer.removeListener('auth-success', handleAuthSuccess);
      ipcRenderer.removeListener('auth-expired', handleAuthExpired);
    };
  }, [ipcRenderer]);

  return { isAuthenticated, checkingAuth };
};

