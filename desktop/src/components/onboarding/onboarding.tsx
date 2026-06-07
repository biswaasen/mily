import React, { useState } from 'react';
import { useIpc } from '../../hooks/useIpc';
import { MicrophoneStep } from '../permission/microphone';
import { AccessibilityStep } from '../permission/accessibility';

type Step = 'setup' | 'microphone' | 'accessibility';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS: Step[] = ['setup', 'microphone', 'accessibility'];

function ProgressDots({ current }: { current: Step }) {
  const permSteps: Step[] = ['microphone', 'accessibility'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {permSteps.map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            current === s
              ? 'w-6 bg-neutral-900'
              : STEPS.indexOf(current) > STEPS.indexOf(s)
              ? 'w-4 bg-neutral-400'
              : 'w-4 bg-neutral-200'
          }`}
        />
      ))}
    </div>
  );
}

function SetupStep({
  onNext,
}: {
  onNext: (name: string, apiKey: string) => void;
}) {
  const ipcRenderer = useIpc();
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your Groq API key.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const valid = await ipcRenderer.invoke('verify-groq-key', apiKey.trim());
      if (!valid) {
        setError('Invalid API key. Please check and try again.');
        return;
      }
      await ipcRenderer.invoke('set-user-name', name.trim());
      await ipcRenderer.invoke('set-groq-key', apiKey.trim());
      onNext(name.trim(), apiKey.trim());
    } catch {
      setError('Could not verify API key. Check your internet connection.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-garamond font-semibold text-neutral-700 uppercase tracking-wide">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent text-sm font-garamond text-neutral-900 placeholder:text-neutral-400 bg-white"
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-garamond font-semibold text-neutral-700 uppercase tracking-wide">
          Groq API key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="gsk_..."
          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent text-sm font-mono text-neutral-900 placeholder:text-neutral-400 bg-white"
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        />
        <p className="text-xs font-garamond text-neutral-500">
          Get your free key at{' '}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-900 underline underline-offset-2"
          >
            console.groq.com/keys
          </a>
        </p>
      </div>

      {error && (
        <p className="text-xs font-garamond text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={verifying}
        className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-garamond font-medium transition-all focus:outline-none flex items-center justify-center gap-2"
      >
        {verifying ? (
          <>
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Verifying key...
          </>
        ) : (
          'Continue →'
        )}
      </button>
    </div>
  );
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('setup');
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const ipcRenderer = useIpc();

  const handleSetupNext = () => {
    setStep('microphone');
  };

  const handleAllowMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
      setStep('accessibility');
    } catch {
      setMicGranted(false);
    }
  };

  const handleOpenSystemSettings = () => {
    ipcRenderer.send('open-accessibility-settings');
  };

  const handleCheckAccessibility = async (): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke('test-accessibility');
    } catch {
      return false;
    }
  };

  const handleAccessibilityGranted = async () => {
    try {
      await ipcRenderer.invoke('complete-onboarding');
    } catch {}
    onComplete();
  };

  const stepTitle =
    step === 'setup'
      ? 'Welcome to Mily'
      : 'Set up Mily';

  const stepSubtitle =
    step === 'setup'
      ? 'Your open-source AI voice assistant.'
      : step === 'microphone'
      ? 'Step 1 of 2 — Microphone'
      : 'Step 2 of 2 — Accessibility';

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-8" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="w-full max-w-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
            <img src="public/logo.png" alt="Mily" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-garamond font-medium text-neutral-900 tracking-tight">
            {stepTitle}
          </h1>
          <p className="text-sm font-garamond text-neutral-500 mt-1.5">{stepSubtitle}</p>
        </div>

        {step === 'setup' && (
          <SetupStep onNext={handleSetupNext} />
        )}

        {step !== 'setup' && (
          <>
            <ProgressDots current={step} />
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              {step === 'microphone' && (
                <MicrophoneStep
                  micGranted={micGranted}
                  onAllow={handleAllowMicrophone}
                />
              )}
              {step === 'accessibility' && (
                <AccessibilityStep
                  onOpenSettings={handleOpenSystemSettings}
                  onCheck={handleCheckAccessibility}
                  onGranted={handleAccessibilityGranted}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
