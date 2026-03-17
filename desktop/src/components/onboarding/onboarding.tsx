import React, { useState } from 'react';
import { useIpc } from '../../hooks/useIpc';
import { MicrophoneStep } from '../permission/microphone';
import { AccessibilityStep } from '../permission/accessibility';

type Step = 'welcome' | 'microphone' | 'accessibility';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS: Step[] = ['welcome', 'microphone', 'accessibility'];

function ProgressDots({ current }: { current: Step }) {
  const permSteps: Step[] = ['microphone', 'accessibility'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {permSteps.map((s, i) => (
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

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const ipcRenderer = useIpc();

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

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-8" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="w-full max-w-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
            <img src="public/logo.png" alt="Mily" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-garamond font-medium text-neutral-900 tracking-tight">
            {step === 'welcome' ? 'Welcome to Mily' : 'Set up Mily'}
          </h1>
          <p className="text-sm font-garamond text-neutral-500 mt-1.5">
            {step === 'welcome'
              ? 'Your AI assistant that listens and acts.'
              : step === 'microphone'
              ? 'Step 1 of 2 — Microphone'
              : 'Step 2 of 2 — Accessibility'}
          </p>
        </div>

        {/* Welcome step */}
        {step === 'welcome' && (
          <div className="space-y-5">
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-4">
              <p className="text-sm font-garamond text-neutral-600 leading-relaxed">
                Mily needs two quick permissions to work. This only takes a minute.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-garamond font-semibold text-neutral-900">Microphone</p>
                    <p className="text-xs font-garamond text-neutral-500">To hear your voice when you record</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-garamond font-semibold text-neutral-900">Accessibility</p>
                    <p className="text-xs font-garamond text-neutral-500">To type Mily's responses into your apps</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('microphone')}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-all focus:outline-none"
            >
              Get started →
            </button>
          </div>
        )}

        {/* Permission steps */}
        {step !== 'welcome' && (
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
