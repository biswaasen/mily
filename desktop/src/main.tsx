import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { UserProfile, Subscription } from './types';
import { useIpc } from './hooks/useIpc';
import { getConfig } from './utils/ipc';
import { UserApi } from './services/api/user.api';
import { SubscriptionApi } from './services/api/subscription.api';
import { Onboarding } from './components/onboarding';
import { LoginScreen } from './components/login';
import { Dashboard, UpdateNotification } from './components/dashboard';

const MainApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const ipcRenderer = useIpc();
  const loadProfileRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig();
        if (config.BACKEND_URL) {
          setBackendUrl(config.BACKEND_URL);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!backendUrl) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const token = await ipcRenderer.invoke('get-auth-token');
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const sessionResult = await ipcRenderer.invoke('validate-session');
        if (!sessionResult.valid) {
          if (sessionResult.unreachable) {
            setBackendUnavailable(true);
            setIsAuthenticated(true);
            setUser(null);
            setSubscription(null);
            setLoading(false);
            return;
          }
          setBackendUnavailable(false);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setBackendUnavailable(false);
        setIsAuthenticated(true);

        const getToken = () => ipcRenderer.invoke('get-auth-token');
        const userApi = new UserApi(backendUrl, getToken);
        const subscriptionApi = new SubscriptionApi(backendUrl, getToken);

        const [userData, subData] = await Promise.all([
          userApi.getUser().catch(() => null),
          subscriptionApi.getSubscription().catch(() => null),
        ]);

        if (userData) setUser(userData);
        if (subData) setSubscription(subData);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadProfileRef.current = loadProfile;
    loadProfile();

    const handleAuthSuccess = () => {
      setIsAuthenticated(null);
      setLoading(true);
      loadProfile();
    };

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setUser(null);
      setSubscription(null);
      setLoading(false);
    };

    const handleAuthError = () => {
      setIsAuthenticated(false);
      setLoading(false);
    };

    ipcRenderer.on('auth-success', handleAuthSuccess);
    ipcRenderer.on('auth-expired', handleAuthExpired);
    ipcRenderer.on('auth-error', handleAuthError);

    return () => {
      ipcRenderer.removeListener('auth-success', handleAuthSuccess);
      ipcRenderer.removeListener('auth-expired', handleAuthExpired);
      ipcRenderer.removeListener('auth-error', handleAuthError);
    };
  }, [backendUrl, ipcRenderer]);

  useEffect(() => {
    if (!backendUnavailable || !backendUrl) return;
    const intervalMs = 5000;
    const id = setInterval(async () => {
      try {
        const r = await ipcRenderer.invoke('validate-session');
        if (r.valid) {
          setBackendUnavailable(false);
          loadProfileRef.current?.();
        }
      } catch (_) {}
    }, intervalMs);
    return () => clearInterval(id);
  }, [backendUnavailable, backendUrl, ipcRenderer]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadOnboardingStatus = async () => {
      try {
        const status = await ipcRenderer.invoke('get-onboarding-status');
        setOnboardingCompleted(status);
      } catch {
        setOnboardingCompleted(false);
      }
    };
    loadOnboardingStatus();
  }, [isAuthenticated, ipcRenderer]);

  useEffect(() => {
    if (!isAuthenticated || !onboardingCompleted) return;

    const checkAccessibility = async () => {
      try {
        const ok = await ipcRenderer.invoke('test-accessibility');
        if (!ok) {
          setOnboardingCompleted(false);
        }
      } catch {}
    };
    checkAccessibility();
  }, [isAuthenticated, onboardingCompleted, ipcRenderer]);

  const handleLogout = () => {
    ipcRenderer.send('logout');
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
          <p className="text-sm font-garamond text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <LoginScreen />;
  }

  if (onboardingCompleted === null) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
          <p className="text-sm font-garamond text-neutral-600">Preparing setup...</p>
        </div>
      </div>
    );
  }

  if (onboardingCompleted === false) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} />;
  }

  const handleRefreshSubscription = async () => {
    if (!backendUrl) return;
    try {
      const getToken = () => ipcRenderer.invoke('get-auth-token');
      const subscriptionApi = new SubscriptionApi(backendUrl, getToken);
      const subData = await subscriptionApi.getSubscription().catch(() => null);
      if (subData) setSubscription(subData);
    } catch (_) {}
  };

  return (
    <>
      <UpdateNotification />
      <Dashboard
        isAuthenticated={isAuthenticated}
        user={user}
        subscription={subscription}
        onLogout={handleLogout}
        backendUrl={backendUrl}
        onUserUpdate={setUser}
        backendUnavailable={backendUnavailable}
        onRefreshSubscription={handleRefreshSubscription}
      />
    </>
  );
};

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

