"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth.api";
import { authUtils } from "@/lib/utils/auth.utils";

const appIcons = [
  {
    id: "mail",
    name: "Mail",
    icon: "/logos/mail.png",
    mobilePosition: "top-[8%] left-[15%]",
    desktopPosition: "top-[12%] left-[10%]",
    delay: "0s",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "/logos/gmail.png",
    mobilePosition: "top-[8%] left-[50%] -translate-x-1/2",
    desktopPosition: "top-[8%] left-[35%]",
    delay: "0.5s",
  },
  {
    id: "notion",
    name: "Notion",
    icon: "/logos/notion.png",
    mobilePosition: "top-[8%] right-[15%]",
    desktopPosition: "top-[10%] right-[35%]",
    delay: "1s",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "/logos/slack.png",
    mobilePosition: "bottom-[8%] left-[50%] -translate-x-1/2",
    desktopPosition: "left-[6%] top-[45%]",
    delay: "1.5s",
  },
  {
    id: "notes",
    name: "Notes",
    icon: "/logos/notes.png",
    mobilePosition: "bottom-[8%] right-[15%]",
    desktopPosition: "right-[10%] top-[20%]",
    delay: "2s",
  },
  {
    id: "googledocs",
    name: "Google Docs",
    icon: "/logos/googledocs.png",
    mobilePosition: "hidden",
    desktopPosition: "right-[6%] top-[50%]",
    delay: "2.5s",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    icon: "/logos/obsidian.svg",
    mobilePosition: "hidden",
    desktopPosition: "bottom-[12%] left-[10%]",
    delay: "3s",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "/logos/whatsapp.svg",
    mobilePosition: "hidden",
    desktopPosition: "bottom-[8%] left-[30%]",
    delay: "3.5s",
  },
  {
    id: "cursor",
    name: "Cursor",
    icon: "/logos/cursor.png",
    mobilePosition: "hidden",
    desktopPosition: "bottom-[6%] right-[30%]",
    delay: "4s",
  },
  {
    id: "chrome",
    name: "Chrome",
    icon: "/logos/chrome.svg",
    mobilePosition: "hidden",
    desktopPosition: "bottom-[15%] right-[10%]",
    delay: "4.5s",
  },
];

export default function HeroSection() {
  const [loadingArch, setLoadingArch] = useState<string | null>(null);

  const handleDownload = async (arch: "arm64" | "intel") => {
    setLoadingArch(arch);
    if (!authUtils.isAuthenticated()) {
      try {
        const response = await authApi.authenticateForDownload();
        authUtils.handleDownloadAuthSuccess(response.auth_token);
      } catch (error) {
        console.error("Auth failed:", error);
        setLoadingArch(null);
        return;
      }
    }
    window.location.href = `/download?arch=${arch}`;
  };

  return (
    <section
      id="download"
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-24 sm:py-0 bg-white"
    >
      <div className="absolute inset-0 pointer-events-none">
        {appIcons.map((app) => {
          const IconComponent = (
            <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/90 backdrop-blur-md border border-neutral-200/60 p-2 shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300">
              <img
                src={app.icon}
                alt={app.name}
                className="w-full h-full object-contain"
              />
            </div>
          );

          if (app.mobilePosition === "hidden") {
            return (
              <div
                key={app.id}
                className={`hidden md:block absolute animate-float ${app.desktopPosition}`}
                style={{
                  animationDelay: app.delay,
                  animationDuration: "6s",
                }}
              >
                {IconComponent}
              </div>
            );
          }

          return (
            <div key={app.id}>
              <div
                className={`md:hidden absolute animate-float ${app.mobilePosition}`}
                style={{
                  animationDelay: app.delay,
                  animationDuration: "6s",
                }}
              >
                {IconComponent}
              </div>
              <div
                className={`hidden md:block absolute animate-float ${app.desktopPosition}`}
                style={{
                  animationDelay: app.delay,
                  animationDuration: "6s",
                }}
              >
                {IconComponent}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto text-center max-w-3xl relative z-10">        
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-garamond tracking-tight leading-[1.05] mb-6 sm:mb-8 relative overflow-hidden"
          style={{ textShadow: "0px 4px 20px rgba(0, 0, 0, 0.12)" }}
        >
          <span className="relative inline-block text-neutral-900">
            Just say it <br /> Mily will do the rest
          </span>
          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-text-shine pointer-events-none" 
                style={{ transform: 'translateX(-100%) skewX(-15deg)' }}></span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-neutral-600/90 tracking-tight mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          Press <kbd className="px-1.5 py-0.5 text-base font-semibold bg-neutral-100 text-neutral-800 rounded border border-neutral-200">Cmd + D</kbd> to start recording, press again to stop. Transcribe, generate text, or run commands from anywhere.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={() => handleDownload("arm64")}
            disabled={loadingArch !== null}
            className="group h-12 px-8 bg-neutral-900 text-white text-sm font-semibold rounded-xl transition-all hover:bg-neutral-800 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px]"
          >
            {loadingArch === "arm64" ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
            )}
            <span className="relative">
              {loadingArch === "arm64" ? "..." : "Apple Silicon"}
            </span>
          </button>
          <button
            onClick={() => handleDownload("intel")}
            disabled={loadingArch !== null}
            className="group h-12 px-8 bg-white border-2 border-neutral-900 text-neutral-900 text-sm font-semibold rounded-xl transition-all hover:bg-neutral-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto min-w-[200px]"
          >
            {loadingArch === "intel" ? (
              <div className="h-4 w-4 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
            )}
            <span className="relative">
              {loadingArch === "intel" ? "..." : "Intel"}
            </span>
          </button>
        </div>

        <p className="text-sm text-neutral-500 font-light mb-2">macOS · Free</p>
        <p className="text-xs text-neutral-400 font-light">Hold Option to record, or tap once to start and again to stop</p>
      </div>
    </section>
  );
}
