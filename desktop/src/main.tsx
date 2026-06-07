import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useIpc } from './hooks/useIpc';
import { Onboarding } from './components/onboarding';
import { Dashboard, UpdateNotification } from './components/dashboard';

const MainApp: React.FC = () => {
  const [groqKeySet, setGroqKeySet] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const ipcRenderer = useIpc();

  useEffect(() => {
    const init = async () => {
      try {
        const [key, onboarded, name] = await Promise.all([
          ipcRenderer.invoke('get-groq-key'),
          ipcRenderer.invoke('get-onboarding-status'),
          ipcRenderer.invoke('get-user-name'),
        ]);
        setGroqKeySet(!!key);
        setOnboardingCompleted(!!onboarded);
        setUserName(name || null);
      } catch {
        setGroqKeySet(false);
        setOnboardingCompleted(false);
      }
    };
    init();

    const handleReset = () => {
      setGroqKeySet(false);
      setOnboardingCompleted(false);
      setUserName(null);
    };
    ipcRenderer.on('reset-app', handleReset);
    return () => ipcRenderer.removeListener('reset-app', handleReset);
  }, [ipcRenderer]);

  useEffect(() => {
    if (!groqKeySet || !onboardingCompleted) return;
    const checkAccessibility = async () => {
      try {
        const ok = await ipcRenderer.invoke('test-accessibility');
        if (!ok) setOnboardingCompleted(false);
      } catch {}
    };
    checkAccessibility();
  }, [groqKeySet, onboardingCompleted, ipcRenderer]);

  const handleLogout = () => {
    ipcRenderer.send('logout');
  };

  const handleOnboardingComplete = async () => {
    const name = await ipcRenderer.invoke('get-user-name').catch(() => null);
    setUserName(name || null);
    setGroqKeySet(true);
    setOnboardingCompleted(true);
  };

  if (groqKeySet === null || onboardingCompleted === null) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
          <p className="text-sm font-garamond text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!groqKeySet || !onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <UpdateNotification />
      <Dashboard
        userName={userName}
        onLogout={handleLogout}
        onUserNameChange={setUserName}
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
