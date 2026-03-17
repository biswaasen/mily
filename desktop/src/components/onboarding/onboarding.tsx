import React, { useState } from 'react';
import { useIpc } from '../../hooks/useIpc';
import { MicrophoneStep, AccessibilityStep } from '../permission';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [microphoneGranted, setMicrophoneGranted] = useState<boolean | null>(null);
  const [accessibilityConfirmed, setAccessibilityConfirmed] = useState(false);
  const ipcRenderer = useIpc();

  const handleAllowMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneGranted(true);
      setStep(2);
    } catch {
      setMicrophoneGranted(false);
    }
  };

  const handleOpenSystemSettings = () => {
    ipcRenderer.send('open-accessibility-settings');
  };

  const handleVerifyAccessibility = async (): Promise<boolean> => {
    if (!microphoneGranted) return false;
    try {
      const ok = await ipcRenderer.invoke('test-accessibility');
      if (ok) {
        setAccessibilityConfirmed(true);
        try {
          await ipcRenderer.invoke('complete-onboarding');
          onComplete();
        } catch {
          onComplete();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
            <img src="public/logo.png" alt="Mily Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-3xl font-garamond text-neutral-900 mb-2 tracking-tight leading-tight">
            Set up Mily
          </h1>
          <p className="text-neutral-600 font-garamond text-sm">
            A quick setup so Mily can hear you and write into your apps.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
          {step === 1 && (
            <MicrophoneStep
              microphoneGranted={microphoneGranted}
              onAllowMicrophone={handleAllowMicrophone}
            />
          )}
          {step === 2 && (
            <AccessibilityStep
              microphoneGranted={microphoneGranted}
              accessibilityConfirmed={accessibilityConfirmed}
              onOpenSystemSettings={handleOpenSystemSettings}
              onVerifyAccessibility={handleVerifyAccessibility}
            />
          )}
        </div>
      </div>
    </div>
  );
};
