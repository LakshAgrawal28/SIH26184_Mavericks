"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedCountProps = {
  value: number;
  durationMs?: number;
  className?: string;
};

/** Count-up when value changes (e.g. scan completion). */
export default function AnimatedCount({
  value,
  durationMs = 600,
  className,
}: AnimatedCountProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) return;

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className={className}>{display}</span>;
}
