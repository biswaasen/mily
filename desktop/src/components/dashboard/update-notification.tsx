import React, { useState } from 'react';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';

const formatErrorMessage = (error: string): string => {
  try {
    if (error.includes('ZIP file not provided')) return 'Update file is missing. Please download the latest version manually.';
    if (error.includes('404') || error.includes('not found')) return 'Update server is unavailable. Please try again later.';
    if (error.includes('network') || error.includes('fetch')) return 'Network error. Please check your connection.';
    return 'Update failed. Please try again later.';
  } catch {
    return 'Update failed. Please try again later.';
  }
};

export const UpdateNotification: React.FC = () => {
  const { updateAvailable, updateDownloaded, downloadProgress, updateError, installUpdate, clearError } = useAutoUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !updateDownloaded) return null;

  if (updateDownloaded) {
    return (
      <div className="fixed top-4 right-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-xl z-50 w-80 backdrop-blur-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Update Ready</p>
              <p className="text-xs text-neutral-600 mt-0.5">Restart to install the update</p>
            </div>
          </div>
          <button type="button" onClick={installUpdate} className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
            Restart
          </button>
        </div>
      </div>
    );
  }

  if (updateError && !dismissed) {
    const friendlyError = formatErrorMessage(updateError);
    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      clearError();
      setDismissed(true);
    };
    return (
      <div className="fixed top-4 right-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-xl z-50 w-80 backdrop-blur-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Update Failed</p>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{friendlyError}</p>
          </div>
          <button type="button" onClick={handleDismiss} className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors p-1 -m-1" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="fixed top-4 right-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-xl z-50 w-80 backdrop-blur-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-neutral-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Downloading Update</p>
            <div className="mt-2.5 w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-neutral-900 h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${downloadProgress}%` }} />
            </div>
            <p className="text-xs text-neutral-600 mt-1.5 font-medium">{downloadProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
