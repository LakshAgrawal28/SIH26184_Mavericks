"use client";

import { useEffect, useState } from "react";
import { IconLogoMark } from "@/components/icons/NavIcons";

const SESSION_KEY = "ecdat_entry_seen";

export function EntrySplash() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setVisible(true);
    const hideTimer = window.setTimeout(() => setVisible(false), 900);
    const doneTimer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 950);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#fbfbfa] motion-enter"
      aria-hidden
      style={{ animation: "ecdat-fade-in 0.35s ease both" }}
    >
      <div className="flex flex-col items-center gap-6">
        <IconLogoMark className="h-10 w-10 text-primary" />
        <p className="text-display text-lg text-foreground">ECDAT</p>
        <div className="h-px w-32 overflow-hidden rounded-full bg-border">
          <div
            className="h-full w-full bg-primary"
            style={{ animation: "ecdat-loader-bar 0.85s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          />
        </div>
      </div>
    </div>
  );
}
