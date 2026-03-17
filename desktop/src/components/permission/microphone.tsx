import React from 'react';
import { useShortcut } from '../../hooks/useShortcut';

interface MicrophoneStepProps {
  microphoneGranted: boolean | null;
  onAllowMicrophone: () => void;
}

export const MicrophoneStep: React.FC<MicrophoneStepProps> = ({
  microphoneGranted,
  onAllowMicrophone,
}) => {
  const { formatShortcut } = useShortcut();
  return (
  <div className="space-y-4">
    <h2 className="text-xl font-garamond text-neutral-900">Microphone access</h2>
    <p className="text-sm font-garamond text-neutral-600 leading-relaxed">
      Mily uses your microphone when you press {formatShortcut()} to record. Please allow microphone access to continue.
    </p>
    <button
      onClick={onAllowMicrophone}
      className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 rounded-xl px-4 py-2.5 text-sm font-garamond text-white transition-all focus:outline-none"
    >
      Allow microphone
    </button>
    {microphoneGranted === false && (
      <p className="text-xs font-garamond text-red-500">
        Microphone access is required. Please enable it in system settings and try again.
      </p>
    )}
  </div>
  );
};
