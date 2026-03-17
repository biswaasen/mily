"use client";

import { useEffect, useState } from "react";

const RAW = `"um hey so the meeting is at 5pm no wait 5.30pm and uh we need to discuss the roadmap also there are like three blockers first the API thing second the design review and third the investor update"`;

const CLEAN = `The meeting is at 5:30 PM and we need to discuss the roadmap. There are three blockers:
1. The API thing
2. The design review
3. The investor update`;

export default function TransformSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById("transform-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="transform-section" className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-garamond font-medium text-neutral-900 tracking-tight mb-4">
            Speak naturally. Get polished text.
          </h2>
          <p className="text-lg font-garamond text-neutral-500 max-w-xl mx-auto">
            Mily listens the way you think — messy, fast, and real — and turns it into clean, formatted writing instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Before */}
          <div
            className={`rounded-2xl border border-neutral-200 bg-neutral-50 p-7 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-garamond uppercase tracking-widest text-neutral-400">You said</span>
            </div>
            <p className="font-garamond text-neutral-500 text-base leading-relaxed italic">{RAW}</p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-neutral-900 items-center justify-center z-10 shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>

          {/* After */}
          <div
            className={`rounded-2xl border-2 border-neutral-900 bg-white p-7 shadow-lg transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-garamond uppercase tracking-widest text-neutral-400">Mily output</span>
            </div>
            <p className="font-garamond text-neutral-900 text-base leading-relaxed whitespace-pre-line">{CLEAN}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
