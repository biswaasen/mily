"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { authUtils } from "@/lib/utils/auth.utils";
import { subscriptionApi, type Subscription } from "@/lib/api/subscription.api";
import { billingApi } from "@/lib/api/billing.api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PageState = "loading" | "ready" | "error";

export default function DashboardPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  }, []);

  const fetchSubscription = useCallback(async (token: string) => {
    try {
      const sub = await subscriptionApi.getSubscription(token);
      setSubscription(sub);
    } catch {
      setErrorMsg("Failed to load subscription data.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login?redirect=/dashboard");
        return;
      }
      setFirebaseUser(user);

      const token = authUtils.getAuthToken();
      if (!token) {
        router.replace("/login?redirect=/dashboard");
        return;
      }

      await fetchSubscription(token);
      setPageState("ready");
    });
    return () => unsubscribe();
  }, [router, fetchSubscription]);

  const handleLogout = async () => {
    await signOut(auth);
    authUtils.removeAuthToken();
    router.replace("/");
  };

  const handleUpgrade = useCallback(async () => {
    if (upgrading) return;
    const token = authUtils.getAuthToken();
    if (!token) return;

    setUpgrading(true);
    try {
      const result = await billingApi.createProSubscription(token);
      if (result.alreadyPro) {
        showToast("You're already on Pro!", "success");
        return;
      }
      const subscriptionId = result.razorpay?.subscriptionId;
      if (!subscriptionId) throw new Error("No subscription ID returned");

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "Mily",
        description: "Pro Plan — Monthly",
        image: "/logo.png",
        handler: async () => {
          showToast("Payment successful! Your plan is now Pro.", "success");
          await fetchSubscription(token);
        },
        modal: {
          ondismiss: () => {
            showToast("Payment cancelled. No charge was made.", "error");
          },
        },
        theme: { color: "#171717" },
      });
      rzp.on("payment.failed", (r: any) => {
        showToast(r?.error?.description || "Payment failed. Please try again.", "error");
      });
      rzp.open();
    } catch (err: any) {
      showToast(err?.message || "Failed to start upgrade", "error");
    } finally {
      setUpgrading(false);
    }
  }, [upgrading, fetchSubscription, showToast]);

  const handleCancel = useCallback(async () => {
    const token = authUtils.getAuthToken();
    if (!token) return;

    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      await billingApi.cancelProSubscription(token);
      showToast("Cancellation scheduled. You'll keep Pro access until your billing period ends.", "success");
      await fetchSubscription(token);
    } catch (err: any) {
      showToast(err?.message || "Failed to cancel subscription", "error");
    } finally {
      setCancelling(false);
    }
  }, [fetchSubscription, showToast]);

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-sm font-garamond text-neutral-600">{errorMsg}</p>
          <button
            onClick={() => router.replace("/login?redirect=/dashboard")}
            className="text-sm font-garamond underline text-neutral-800"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  const isPro = subscription?.plan === "pro";
  const used = subscription?.used ?? 0;
  const limit = subscription?.limit ?? 0;
  const usedPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Mily" className="h-7 w-7 object-contain" />
            <span className="text-lg font-garamond text-neutral-900">Mily</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-garamond text-neutral-500 hidden sm:block">
              {firebaseUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-garamond text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-garamond font-semibold text-neutral-900">Account</h1>
          <p className="text-sm font-garamond text-neutral-500 mt-1">
            Manage your plan and usage
          </p>
        </div>

        {/* Plan card */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-garamond uppercase tracking-widest text-neutral-400 mb-1">
                Current plan
              </p>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-garamond font-semibold text-neutral-900">
                  {isPro ? "Pro" : "Free"}
                </h2>
                <span
                  className={`text-xs font-garamond px-2.5 py-1 rounded-full ${
                    isPro
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {isPro ? "Active" : "Free tier"}
                </span>
              </div>
            </div>
            {isPro && (
              <div className="text-right">
                <p className="text-xs font-garamond text-neutral-400">Billed monthly</p>
              </div>
            )}
          </div>

          {/* Usage */}
          {subscription && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-garamond text-neutral-600">Tokens this month</p>
                <p className="text-sm font-garamond text-neutral-900">
                  {used.toLocaleString()}
                  <span className="text-neutral-400">
                    {" "}/ {limit.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usedPct > 90 ? "bg-red-500" : "bg-neutral-900"
                  }`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="text-xs font-garamond text-neutral-400">
                {(limit - used).toLocaleString()} tokens remaining
              </p>
            </div>
          )}

          {/* Actions */}
          {!isPro ? (
            <div className="pt-1 space-y-3">
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-garamond uppercase tracking-widest text-neutral-400">
                  Upgrade to Pro
                </p>
                {[
                  ["5,000,000 tokens / month", "10× more than Free"],
                  ["Priority AI responses", "Faster processing"],
                  ["Full memory & context", "Persistent across sessions"],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-garamond text-neutral-800">{title}</span>
                      <span className="text-xs font-garamond text-neutral-400 ml-1.5">{sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white text-sm font-garamond font-medium transition-all flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Starting checkout…
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </button>
            </div>
          ) : (
            <div className="pt-1">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm font-garamond text-neutral-400 hover:text-red-500 transition-colors underline underline-offset-2"
                >
                  Cancel subscription
                </button>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-garamond text-neutral-800">
                    Cancel your Pro subscription? You&apos;ll keep Pro access until the end of your current billing period, then move to Free.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-garamond transition-all flex items-center justify-center gap-2"
                    >
                      {cancelling ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Cancelling…
                        </>
                      ) : (
                        "Yes, cancel"
                      )}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-garamond hover:bg-neutral-50 transition-all"
                    >
                      Keep Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-garamond uppercase tracking-widest text-neutral-400 mb-4">
            Account
          </p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-garamond font-semibold text-base flex-shrink-0">
              {firebaseUser?.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-garamond text-neutral-900 truncate">
                {firebaseUser?.displayName || firebaseUser?.email}
              </p>
              {firebaseUser?.displayName && (
                <p className="text-xs font-garamond text-neutral-400 truncate">
                  {firebaseUser.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-garamond text-neutral-400">
          Need help?{" "}
          <a href="mailto:support@mily.club" className="underline underline-offset-2 hover:text-neutral-600 transition-colors">
           biswaasen@gmail.com
          </a>
        </p>
      </main>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`px-5 py-3 rounded-xl text-sm font-garamond shadow-lg border ${
              toastType === "success"
                ? "bg-white border-neutral-200 text-neutral-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {toastMsg}
          </div>
        </div>
      )}

    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}
