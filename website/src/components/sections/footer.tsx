export default function Footer() {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="font-garamond text-2xl font-semibold text-white mb-3">Mily</p>
            <p className="text-sm font-garamond text-neutral-500 leading-relaxed max-w-[180px]">
              Your voice is your superpower.
            </p>
          </div>

          <div>
            <p className="text-xs font-garamond font-semibold text-neutral-500 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3">
              {["Download", "Features", "Pricing", "Changelog"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-sm font-garamond text-neutral-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-garamond font-semibold text-neutral-500 uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-3">
              {[
                { label: "Twitter / X", href: "https://x.com/milyhq" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Use", href: "#" },
                { label: "Contact", href: "mailto:hi@mily.club" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm font-garamond text-neutral-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-garamond font-semibold text-neutral-500 uppercase tracking-widest mb-4">Download</p>
            <div className="space-y-3">
              <a href="#download" className="flex items-center gap-2 text-sm font-garamond text-neutral-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple Silicon (M-series)
              </a>
              <a href="#download" className="flex items-center gap-2 text-sm font-garamond text-neutral-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Intel Mac
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-garamond text-neutral-600">
            © {new Date().getFullYear()} Mily. All rights reserved.
          </p>
          <p className="text-sm font-garamond text-neutral-600">
            Made with care for people who talk too fast.
          </p>
        </div>
      </div>
    </footer>
  );
}
