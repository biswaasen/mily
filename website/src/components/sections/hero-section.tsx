import { Mic, ExternalLink, KeyRound, SlidersHorizontal, Code2 } from "lucide-react";

const GITHUB = "https://github.com/biswaasen/mickey";

const FEATURES = [
  {
    icon: Mic,
    text: "Transcription that cleans your speech and pastes into the app you are in",
  },
  {
    icon: ExternalLink,
    text: "Action mode to open saved links and apps by voice",
  },
  {
    icon: KeyRound,
    text: "Your own API key with no subscription",
  },
  {
    icon: SlidersHorizontal,
    text: "Change models and prompts on your machine",
  },
  {
    icon: Code2,
    text: "Open source for macOS",
  },
];

export default function HeroSection() {
  return (
    <main className="min-h-[100svh] bg-black text-white flex items-center px-6">
      <div className="w-full max-w-xl mx-auto">
        <pre
          className="text-3xl text-neutral-300 mb-8 select-none"
          style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
          aria-hidden
        >
          ◔ᴗ◔
        </pre>

        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-white mb-4">
          mickey
        </h1>

        <p className="text-base text-neutral-400 leading-relaxed mb-10 max-w-md">
          Speak while you work. Mickey types for you or opens what you ask for.
        </p>

        <ul className="space-y-4 mb-12">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="text-sm text-neutral-300 leading-snug flex gap-3.5 items-start">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-neutral-400">
                <Icon size={14} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="pt-1">{text}</span>
            </li>
          ))}
        </ul>

        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 px-5 items-center rounded-md bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </main>
  );
}
