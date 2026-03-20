"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth.api";
import { authUtils } from "@/lib/utils/auth.utils";

function DownloadContent() {
  const searchParams = useSearchParams();
  const arch = searchParams.get("arch") || "arm64";
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const version = "1.0.22";
  
  const downloadUrl = arch === "intel"
    ? `https://storage.googleapis.com/mily-releases/Mily-${version}.dmg`
    : `https://storage.googleapis.com/mily-releases/Mily-${version}-arm64.dmg`;

  useEffect(() => {
    const initiateDownload = async () => {
      if (!authUtils.isAuthenticated()) {
        setAuthenticating(true);
        try {
          const response = await authApi.authenticateForDownload();
          authUtils.handleDownloadAuthSuccess(response.auth_token);
          setAuthenticating(false);
          startDownload();
        } catch (err) {
          setAuthenticating(false);
          setError("Authentication failed. Please try again.");
          return;
        }
      } else {
        startDownload();
      }
    };

    const startDownload = () => {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadStarted(true);
      }, 500);

      return () => clearTimeout(timer);
    };

    initiateDownload();
  }, [downloadUrl]);

  const handleManualDownload = async () => {
    if (!authUtils.isAuthenticated()) {
      setAuthenticating(true);
      try {
        const response = await authApi.authenticateForDownload();
        authUtils.handleDownloadAuthSuccess(response.auth_token);
        setAuthenticating(false);
      } catch (err) {
        setAuthenticating(false);
        setError("Authentication failed. Please try again.");
        return;
      }
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadStarted(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-garamond text-center">{error}</p>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-neutral-100 rounded-2xl">
            {authenticating ? (
              <div className="h-8 w-8 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
            ) : (
              <svg className="w-8 h-8 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </div>
          <h1 className="text-4xl font-garamond text-neutral-900 mb-3 tracking-tight">
            {authenticating ? "Authenticating..." : downloadStarted ? "Download Started" : "Preparing Download..."}
          </h1>
          <p className="text-neutral-600 font-garamond">
            Mily for macOS ({arch === "intel" ? "Intel" : "Apple Silicon"})
          </p>
        </div>

        <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-8 mb-6">
          <h2 className="text-xl font-garamond text-neutral-900 mb-6">
            Installation Steps
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-garamond">
                1
              </div>
              <div>
                <h3 className="font-garamond text-neutral-900 mb-1">
                  Open the downloaded file
                </h3>
                <p className="text-sm text-neutral-600 font-garamond">
                  Double-click <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-neutral-200">Mily-{version}{arch === "arm64" ? "-arm64" : ""}.dmg</span> in your Downloads folder
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-garamond">
                2
              </div>
              <div>
                <h3 className="font-garamond text-neutral-900 mb-1">
                  Drag to Applications
                </h3>
                <p className="text-sm text-neutral-600 font-garamond">
                  Drag the Mily icon into the Applications folder
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-garamond">
                3
              </div>
              <div>
                <h3 className="font-garamond text-neutral-900 mb-1">
                  Launch Mily
                </h3>
                <p className="text-sm text-neutral-600 font-garamond">
                  Open Mily from your Applications folder and sign in with Google
                </p>
              </div>
            </div>
          </div>
        </div>

        {!downloadStarted && !authenticating && (
          <div className="text-center">
            <p className="text-sm text-neutral-600 font-garamond mb-4">
              Download not starting?
            </p>
            <button
              onClick={handleManualDownload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-garamond transition-colors"
            >
              Download Manually
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900 font-garamond underline transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
      </div>
    }>
      <DownloadContent />
    </Suspense>
  );
}
