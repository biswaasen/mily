"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authApi } from "@/lib/api/auth.api";
import { authUtils } from "@/lib/utils/auth.utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && authUtils.isAuthenticated()) {
        router.replace(redirect);
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router, redirect]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.loginWithGoogle();

      if (typeof window !== "undefined" && (window as any).electronAPI) {
        authUtils.handleAuthSuccess(response.auth_token);
      } else {
        authUtils.saveAuthToken(response.auth_token);
        router.replace(redirect);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="h-screen w-full bg-[#fafaf9] flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <img src="/logo.png" alt="Mily" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-garamond text-neutral-900">Mily</span>
          </div>
          <h1 className="text-3xl font-garamond font-semibold text-neutral-900 leading-tight">
            Welcome back
          </h1>
          <p className="text-sm font-garamond text-neutral-500 mt-2">
            Sign in to manage your account
          </p>
        </div>

        <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-garamond">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 rounded-xl px-6 py-3.5 text-sm font-garamond text-white transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs font-garamond text-neutral-400 text-center">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
