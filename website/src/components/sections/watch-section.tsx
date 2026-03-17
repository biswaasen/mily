"use client";

const DEMO_VIDEO = "https://k26riqmsptuevwtz.public.blob.vercel-storage.com/demo.mp4";

export default function WatchSection() {
  return (
    <section id="watch" className="bg-white px-4 sm:px-6 py-20 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-garamond font-normal bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-600 tracking-tight mb-4 py-2">
            Watch Mily Work
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600/90 max-w-2xl mx-auto leading-relaxed font-light">
            See how Mily transcribes audio, generates content, and executes commands—press Cmd + D to start recording, press again to stop.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl border border-neutral-200/50 hover:shadow-3xl transition-shadow duration-500">
          <video
            src={DEMO_VIDEO}
            controls
            playsInline
            className="w-full"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
