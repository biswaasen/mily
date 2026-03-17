"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-garamond text-2xl font-semibold text-neutral-900 tracking-tight">
          Mily
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Reviews", href: "#reviews" },
            { label: "Pricing", href: "#pricing" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-garamond text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        <a
          href="#download"
          className="h-9 px-5 rounded-full bg-neutral-900 text-white text-sm font-garamond font-medium hover:bg-neutral-700 transition-colors flex items-center"
        >
          Download free
        </a>
      </div>
    </nav>
  );
}
