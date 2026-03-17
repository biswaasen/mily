import React from 'react';
import { useShortcut } from '../../hooks/useShortcut';

interface MicrophoneStepProps {
  micGranted: boolean | null;
  onAllow: () => void;
}

export const MicrophoneStep: React.FC<MicrophoneStepProps> = ({ micGranted, onAllow }) => {
  const { formatShortcut } = useShortcut();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-garamond font-semibold text-neutral-900">Microphone access</h2>
          <p className="text-xs font-garamond text-neutral-500 mt-0.5">Required to record your voice</p>
        </div>
      </div>

      <p className="text-sm font-garamond text-neutral-600 leading-relaxed">
        When you press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 text-neutral-800 rounded border border-neutral-300">{formatShortcut()}</kbd>, Mily listens to your voice and processes it. Your audio is never stored.
      </p>

      {micGranted === false ? (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-garamond text-amber-800 leading-relaxed">
              Microphone access was denied. Open <strong>System Settings → Privacy & Security → Microphone</strong> and enable Mily.
            </p>
          </div>
          <button
            onClick={onAllow}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-all focus:outline-none"
          >
            Try again
          </button>
        </div>
      ) : micGranted === true ? (
        <div className="flex items-center gap-2 py-3 px-4 bg-green-50 border border-green-200 rounded-xl">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-garamond text-green-800 font-medium">Microphone access granted</p>
        </div>
      ) : (
        <button
          onClick={onAllow}
          className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-all focus:outline-none"
        >
          Allow microphone access
        </button>
      )}
    </div>
  );
};
