import React, { useState, useEffect, useRef } from 'react';

interface AccessibilityStepProps {
  onOpenSettings: () => void;
  onCheck: () => Promise<boolean>;
  onGranted: () => void;
}

export const AccessibilityStep: React.FC<AccessibilityStepProps> = ({
  onOpenSettings,
  onCheck,
  onGranted,
}) => {
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-poll every 1.5s once user has opened system settings
  useEffect(() => {
    if (!settingsOpened || granted) return;

    pollRef.current = setInterval(async () => {
      const ok = await onCheck();
      if (ok) {
        setGranted(true);
        clearInterval(pollRef.current!);
        setTimeout(() => onGranted(), 800);
      }
    }, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [settingsOpened, granted, onCheck, onGranted]);

  const handleOpenSettings = () => {
    setSettingsOpened(true);
    onOpenSettings();
  };

  const handleManualCheck = async () => {
    setChecking(true);
    const ok = await onCheck();
    setChecking(false);
    if (ok) {
      setGranted(true);
      if (pollRef.current) clearInterval(pollRef.current);
      setTimeout(() => onGranted(), 800);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-garamond font-semibold text-neutral-900">Accessibility access</h2>
          <p className="text-xs font-garamond text-neutral-500 mt-0.5">Required to type into your apps</p>
        </div>
      </div>

      <p className="text-sm font-garamond text-neutral-600 leading-relaxed">
        Mily uses accessibility to type responses directly into any app — like Notion, Slack, or Gmail — when you stop recording.
      </p>

      {/* Instructions — shown after settings opened */}
      {settingsOpened && !granted && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-garamond font-semibold text-neutral-700 uppercase tracking-wider">In System Settings:</p>
          <ol className="space-y-2.5">
            {[
              { n: '1', text: 'Go to Privacy & Security → Accessibility' },
              { n: '2', text: 'Click the + button and add Mily' },
              { n: '3', text: 'Toggle Mily on and authenticate with Touch ID' },
            ].map(({ n, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {n}
                </span>
                <span className="text-sm font-garamond text-neutral-700 leading-snug">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Granted state */}
      {granted ? (
        <div className="flex items-center gap-2 py-3 px-4 bg-green-50 border border-green-200 rounded-xl">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-garamond text-green-800 font-medium">Accessibility access granted — opening Mily…</p>
        </div>
      ) : !settingsOpened ? (
        <button
          onClick={handleOpenSettings}
          className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-all focus:outline-none"
        >
          Open System Settings
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-2.5 px-4 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-neutral-400 border-t-neutral-900 animate-spin flex-shrink-0" />
            <p className="text-xs font-garamond text-neutral-600">Waiting for permission… will continue automatically</p>
          </div>
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-garamond transition-all focus:outline-none disabled:opacity-50"
          >
            {checking ? 'Checking…' : "I've enabled it — check now"}
          </button>
        </div>
      )}
    </div>
  );
};
