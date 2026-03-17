const steps = [
  {
    n: "01",
    title: "Press your shortcut",
    desc: "Hold Cmd + M from anywhere on your Mac. Mily appears as a small floating bar — no window switching needed.",
  },
  {
    n: "02",
    title: "Speak naturally",
    desc: "Talk exactly how you think. Ramble, self-correct, list items. Mily's AI listens without judgment.",
  },
  {
    n: "03",
    title: "Text appears instantly",
    desc: "Press the shortcut again to stop. Your cleaned, formatted text is pasted directly where your cursor is.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-garamond font-medium text-neutral-900 tracking-tight mb-4">
            Three steps. That's it.
          </h2>
          <p className="text-lg font-garamond text-neutral-500">
            Mily fits into your workflow in under 60 seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-full w-full h-px bg-neutral-200 -translate-y-1/2 z-0" style={{ width: "calc(100% - 2rem)", left: "calc(100% - 1rem)" }} />
              )}
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mb-6">
                  <span className="text-white font-garamond font-semibold text-lg">{n}</span>
                </div>
                <h3 className="text-xl font-garamond font-semibold text-neutral-900 mb-3">{title}</h3>
                <p className="text-sm font-garamond text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcut highlight */}
        <div className="mt-16 bg-neutral-50 rounded-2xl border border-neutral-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-garamond font-semibold text-neutral-900 mb-1">One shortcut. Total control.</p>
            <p className="text-sm font-garamond text-neutral-500">Works in every app, every window, every moment.</p>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-4 py-2.5 bg-neutral-900 text-white font-garamond font-semibold text-base rounded-xl shadow-md border-b-4 border-neutral-950">
              Cmd + M
            </kbd>
            <span className="text-neutral-400 font-garamond">to start & stop</span>
          </div>
        </div>
      </div>
    </section>
  );
}
