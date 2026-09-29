"use client";

import { useEffect, useState } from "react";

const CIPHER = "∅∆◊⌁⊕⊗⌬⌖⌗⌘⌙⌚⌛⌜⌝⌞⌟";
const TARGET = "RSA-2048 · AES-256-GCM · SHA-256";

/** Deterministic mask — same on server and client (no Math.random during SSR). */
const INITIAL_MASK = TARGET.replace(/[^\s]/g, (_, i) => CIPHER[i % CIPHER.length]);

function scrambleFrame(progress: number): string {
  const reveal = Math.floor(progress * TARGET.length);
  let out = "";
  for (let i = 0; i < TARGET.length; i++) {
    if (i < reveal) {
      out += TARGET[i];
    } else if (TARGET[i] === " ") {
      out += " ";
    } else {
      out += CIPHER[Math.floor(Math.random() * CIPHER.length)];
    }
  }
  return out;
}

type CipherScrambleProps = {
  className?: string;
  durationMs?: number;
};

/** Single hero load animation: ciphertext resolving into algorithm names. */
export default function CipherScramble({ className, durationMs = 2200 }: CipherScrambleProps) {
  const [text, setText] = useState(INITIAL_MASK);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(TARGET);
      setDone(true);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setText(scrambleFrame(eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setText(TARGET);
        setDone(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs]);

  return (
    <p
      className={className}
      aria-live="polite"
      data-resolved={done ? "true" : "false"}
    >
      {text}
    </p>
  );
}
