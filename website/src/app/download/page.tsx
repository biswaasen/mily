import Link from "next/link";

const GITHUB = "https://github.com/biswaasen/mickey";

export default function DownloadPage() {
  return (
    <main className="min-h-[100svh] bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-medium tracking-tight mb-3">mickey</h1>
      <p className="text-sm text-neutral-400 mb-8 max-w-sm">
        Builds ship from GitHub Releases.
      </p>
      <a
        href={`${GITHUB}/releases`}
        target="_blank"
        rel="noreferrer"
        className="h-10 px-5 rounded-md bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors inline-flex items-center"
      >
        View on GitHub
      </a>
      <Link href="/" className="mt-10 text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
        ← back
      </Link>
    </main>
  );
}
