import { useState } from 'react';
import { Plus, Search, Fingerprint, Check, X, AlertCircle } from 'lucide-react';

interface AccessibilityStepProps {
  microphoneGranted: boolean | null;
  accessibilityConfirmed: boolean;
  onOpenSystemSettings: () => void;
  onVerifyAccessibility: () => Promise<boolean>;
}

export const AccessibilityStep: React.FC<AccessibilityStepProps> = ({
  microphoneGranted,
  accessibilityConfirmed,
  onOpenSystemSettings,
  onVerifyAccessibility,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState<boolean | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const verifyAccessibility = async () => {
    if (!microphoneGranted) return;
    setIsVerifying(true);
    setAccessibilityEnabled(null);
    try {
      const isEnabled = await onVerifyAccessibility();
      setAccessibilityEnabled(isEnabled);
      if (!isEnabled) setShowInstructions(true);
    } catch {
      setAccessibilityEnabled(false);
      setShowInstructions(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-garamond text-neutral-900">System permissions</h2>
      <p className="text-sm font-garamond text-neutral-600 leading-relaxed">
        Mily needs permission to paste text into your apps using the keyboard shortcut.
      </p>

      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-garamond font-semibold text-blue-900 mb-2">
                How to enable accessibility permissions:
              </p>
              <ol className="space-y-2 text-xs font-garamond text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-semibold">1</span>
                  <span>Click the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold"><Plus className="h-3 w-3" /> plus button</span> in the bottom left of System Settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-semibold">2</span>
                  <span>Search for <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold"><Search className="h-3 w-3" /> "Mily"</span> in the search box</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-semibold">3</span>
                  <span>Enable the toggle next to Mily and authenticate with <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold"><Fingerprint className="h-3 w-3" /> Touch ID</span> or your password</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={onOpenSystemSettings}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 rounded-xl px-4 py-2.5 text-sm font-garamond text-white transition-all focus:outline-none"
        >
          Open system settings
        </button>
        <button
          onClick={verifyAccessibility}
          disabled={!microphoneGranted || isVerifying}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-garamond transition-all focus:outline-none ${
            microphoneGranted && !isVerifying ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-50 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isVerifying ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
              Checking...
            </>
          ) : accessibilityEnabled === true ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Access enabled
            </>
          ) : accessibilityEnabled === false ? (
            <>
              <X className="h-4 w-4 text-red-600" />
              Access not enabled
            </>
          ) : (
            'I have enabled access'
          )}
        </button>
      </div>

      {accessibilityEnabled === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-garamond text-red-700">
            Accessibility permission is not enabled. Please follow the instructions above to enable it in System Settings.
          </p>
        </div>
      )}

      {accessibilityConfirmed && accessibilityEnabled === true && (
        <p className="text-xs font-garamond text-green-600">✓ Accessibility permission enabled successfully!</p>
      )}
    </div>
  );
};
