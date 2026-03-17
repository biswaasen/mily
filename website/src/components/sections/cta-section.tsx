export default function CtaSection() {
  return (
    <section className="py-28 bg-neutral-900">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-garamond font-medium text-white tracking-tight mb-6 leading-tight">
          Your keyboard is slowing you down.
        </h2>
        <p className="text-lg font-garamond text-neutral-400 mb-10 max-w-xl mx-auto">
          Start speaking. Mily handles the typing. It&apos;s free to download and takes 60 seconds to set up.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#download"
            className="px-8 py-4 rounded-xl bg-white text-neutral-900 font-garamond font-semibold text-base hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download for Mac — free
          </a>
          <a
            href="#pricing"
            className="px-8 py-4 rounded-xl border border-neutral-700 text-neutral-300 font-garamond font-medium text-base hover:border-neutral-500 hover:text-white transition-colors flex items-center justify-center"
          >
            View pricing
          </a>
        </div>
        <p className="text-xs font-garamond text-neutral-600 mt-6">
          macOS Ventura 13.0+ · Apple Silicon & Intel
        </p>
      </div>
    </section>
  );
}
