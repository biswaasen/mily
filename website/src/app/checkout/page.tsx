"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";

type CheckoutStatus = "loading" | "opening" | "success" | "cancelled" | "failed";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");
  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [rzpInstance, setRzpInstance] = useState<any>(null);

  const openCheckout = useCallback((Razorpay: any) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subscription_id: subscriptionId,
      name: "Mily",
      description: "Pro Plan — Monthly",
      image: "/logo.png",
      handler: () => {
        setStatus("success");
        setRzpInstance(null);
      },
      modal: {
        ondismiss: () => {
          setStatus("cancelled");
        },
      },
      theme: { color: "#171717" },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      setStatus("failed");
      setErrorMsg(response?.error?.description || "Payment failed. Please try again.");
    });
    setRzpInstance(rzp);
    rzp.open();
  }, [subscriptionId]);

  useEffect(() => {
    if (!subscriptionId) {
      setStatus("failed");
      setErrorMsg("Invalid checkout link — no subscription ID provided.");
      return;
    }

    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setStatus("opening");
      openCheckout(window.Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setStatus("opening");
      openCheckout(window.Razorpay);
    };
    script.onerror = () => {
      setStatus("failed");
      setErrorMsg("Failed to load payment processor. Check your connection and try again.");
    };
    document.body.appendChild(script);
  }, [subscriptionId, openCheckout]);

  const handleRetry = () => {
    if (rzpInstance) {
      rzpInstance.open();
      setStatus("opening");
    } else if (window.Razorpay && subscriptionId) {
      setStatus("opening");
      openCheckout(window.Razorpay);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <img src="/logo.png" alt="Mily" className="h-9 w-9 object-contain" />
          <span className="text-2xl font-garamond tracking-tight text-neutral-900">Mily</span>
        </div>

        {(status === "loading" || status === "opening") && (
          <div className="text-center space-y-4">
            <div className="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin mx-auto" />
            <div>
              <p className="text-base font-garamond text-neutral-800">
                {status === "loading" ? "Preparing your checkout…" : "Complete payment in the popup"}
              </p>
              {status === "opening" && (
                <p className="text-sm font-garamond text-neutral-400 mt-1">
                  If the window closed, click below to reopen it.
                </p>
              )}
            </div>
            {status === "opening" && (
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-garamond text-neutral-600 underline underline-offset-4 hover:text-neutral-900 transition-colors"
              >
                Reopen payment window
              </button>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-neutral-900 opacity-10 animate-ping" />
              <div className="relative h-20 w-20 rounded-full bg-neutral-900 flex items-center justify-center mx-auto">
                <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <p className="text-xs font-garamond uppercase tracking-widest text-neutral-400 mb-2">Payment successful</p>
              <h1 className="text-4xl font-garamond font-semibold text-neutral-900 leading-tight">You&apos;re Pro.</h1>
              <p className="text-sm font-garamond text-neutral-500 mt-3 leading-relaxed max-w-xs mx-auto">
                Your plan is now active. Open the Mily desktop app and click{" "}
                <span className="text-neutral-700 font-medium">Paid? Refresh plan</span> to see your new limits.
              </p>
            </div>

            <div className="bg-white border border-neutral-100 rounded-2xl p-5 text-left space-y-3 shadow-sm">
              <p className="text-xs font-garamond uppercase tracking-wider text-neutral-400">What you unlocked</p>
              {[
                ["5,000,000 tokens / month", "10× more than Free"],
                ["Priority AI responses", "Faster, smarter answers"],
                ["Full memory & context", "Persistent across sessions"],
              ].map(([title, sub]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-garamond text-neutral-800">{title}</p>
                    <p className="text-xs font-garamond text-neutral-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/"
              className="block text-sm font-garamond text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
            >
              Back to home
            </a>
          </div>
        )}

        {status === "cancelled" && (
          <div className="text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto">
              <svg className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-garamond font-semibold text-neutral-900">Payment cancelled</h2>
              <p className="text-sm font-garamond text-neutral-500 mt-2">
                No charge was made. You can try again whenever you&apos;re ready.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond transition-colors"
            >
              Try again
            </button>
            <div>
              <a
                href="/"
                className="text-sm font-garamond text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
              >
                Back to home
              </a>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
              <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-garamond font-semibold text-neutral-900">Payment failed</h2>
              <p className="text-sm font-garamond text-neutral-500 mt-2">{errorMsg}</p>
            </div>
            {subscriptionId && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond transition-colors"
              >
                Try again
              </button>
            )}
            <div>
              <a
                href="/"
                className="text-sm font-garamond text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
              >
                Back to home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
