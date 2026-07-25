import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "mickey",
  description:
    "Speak while you work. Mickey types for you or opens what you ask for.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${grotesk.variable} ${mono.variable} antialiased bg-black text-white`}
        style={{ fontFamily: "var(--font-grotesk), system-ui, sans-serif" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
