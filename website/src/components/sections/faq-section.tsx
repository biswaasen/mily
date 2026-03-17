"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Does Mily work in every app?",
    a: "Yes. Mily uses macOS Accessibility to paste text directly wherever your cursor is — Notion, Slack, Gmail, VS Code, Terminal, Arc, Safari, any app. If you can type there, Mily can type there.",
  },
  {
    q: "Is my voice data stored or shared?",
    a: "No. Audio is sent to our servers for processing, transcribed instantly, and discarded. We never store your audio recordings. Your transcribed text is only saved if you choose to keep it in your message history.",
  },
  {
    q: "How is Mily different from Apple's built-in dictation?",
    a: "Apple's dictation is basic — no smart formatting, no self-correction, no AI cleanup, no memory, no voice commands. Mily formats lists, catches corrections mid-sentence, remembers your terminology, and works with more context.",
  },
  {
    q: "What languages does Mily support?",
    a: "Mily's transcription engine supports over 50 languages. You can speak in English, Hindi, French, German, Spanish, Japanese, and many more — and it'll detect your language automatically.",
  },
  {
    q: "Does it need an internet connection?",
    a: "Yes, Mily requires an internet connection to process audio. Transcription is done on our servers using a state-of-the-art model. Local processing support is on the roadmap.",
  },
  {
    q: "Can I change the keyboard shortcut?",
    a: "Yes. Go to Settings in the Mily dashboard and pick any key to use alongside Cmd. The shortcut updates instantly with no restart needed.",
  },
  {
    q: "What macOS versions are supported?",
    a: "Mily supports macOS Ventura 13.0 and above, on both Apple Silicon (M1/M2/M3/M4) and Intel Macs.",
  },
  {
    q: "What is the Memory feature?",
    a: "Memory lets you save key-value context like names, URLs, or preferences. For example, save 'biswa = Biswarup' and Mily will always spell it correctly in transcriptions. You can add, edit, and remove memories from the dashboard.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-28 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-garamond font-medium text-neutral-900 tracking-tight mb-4">
            Questions
          </h2>
          <p className="text-lg font-garamond text-neutral-500">
            Everything you wanted to know.
          </p>
        </div>

        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {faqs.map(({ q, a }, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-6 group"
              >
                <span className="text-base font-garamond font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                  {q}
                </span>
                <svg
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {open === i && (
                <p className="pb-5 text-sm font-garamond text-neutral-600 leading-relaxed">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
