const included = [
  "Unlimited voice transcription",
  "Smart list & self-correction formatting",
  "Works in every macOS app",
  "Voice commands (open apps, search, shortcuts)",
  "Memory — save names, URLs, context",
  "Priority processing — fastest response times",
  "All future features included",
  "macOS native — no browser extension needed",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-garamond font-medium text-neutral-900 tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-lg font-garamond text-neutral-500">
            One plan. Everything included. No surprises.
          </p>
        </div>

        <div className="relative max-w-lg mx-auto">
          {/* Glow effect */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-neutral-300 to-neutral-100 opacity-60 blur-sm" />

          <div className="relative bg-white rounded-3xl border-2 border-neutral-900 p-10 shadow-2xl">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm font-garamond font-semibold text-neutral-500 uppercase tracking-widest mb-2">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-garamond font-semibold text-neutral-900">₹99</span>
                  <span className="text-lg font-garamond text-neutral-500 mb-2">/month</span>
                </div>
                <p className="text-sm font-garamond text-neutral-500 mt-1">Billed monthly · Cancel anytime</p>
              </div>
              <div className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-garamond font-semibold rounded-full">
                Most popular
              </div>
            </div>

            <div className="space-y-3 mb-10">
              {included.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-garamond text-neutral-700">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="#download"
              className="w-full py-4 rounded-xl bg-neutral-900 text-white font-garamond font-semibold text-base hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
            >
              Get started — download free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <p className="text-center text-xs font-garamond text-neutral-400 mt-3">
              Free to download · Upgrade when you&apos;re ready
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
