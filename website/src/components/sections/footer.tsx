"use client";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-garamond font-normal text-neutral-900 mb-1">
              Mily
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 font-light">
              © {new Date().getFullYear()} Mily. All rights reserved.
            </p>
          </div>

          <a
            href="https://x.com/milyhq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Twitter"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
