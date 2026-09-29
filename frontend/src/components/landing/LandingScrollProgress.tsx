"use client";

import { useEffect, useState } from "react";

const PIPELINE = [
  { id: "hero", label: "Estate" },
  { id: "blind-spot", label: "Scan" },
  { id: "discover", label: "Artefacts" },
  { id: "cbom", label: "CBOM" },
  { id: "risk", label: "Mosca" },
  { id: "graph", label: "Graph" },
  { id: "pqc", label: "PQC" },
  { id: "command", label: "Launch" },
] as const;

/**
 * Vertical scroll progress + pipeline mini-nav (PS 26164 journey).
 */
export function LandingScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>("hero");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sections = PIPELINE.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.15, 0.4] }
    );
    sections.forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <div
        className="ecdat-scroll-progress pointer-events-none fixed inset-y-0 left-0 z-[60] w-[3px]"
        aria-hidden
      >
        <div className="ecdat-scroll-progress-fill" style={{ transform: `scaleY(${progress})` }} />
      </div>
      <nav
        className="ecdat-pipeline-nav pointer-events-none fixed right-4 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-2 lg:flex"
        aria-label="PS 26164 pipeline"
      >
        {PIPELINE.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className={`ecdat-pipeline-dot pointer-events-auto font-mono text-[9px] tracking-[0.12em] uppercase transition-all duration-300 ${
              active === p.id ? "ecdat-pipeline-dot-active" : "text-ink-muted/50"
            }`}
            title={p.label}
          >
            <span className="sr-only">{p.label}</span>
            <span aria-hidden className="block h-2 w-2 rounded-full border border-current" />
          </a>
        ))}
      </nav>
    </>
  );
}
