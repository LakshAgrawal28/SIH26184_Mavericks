"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SAMPLE_DATA_LABEL } from "@/lib/landingDemoData";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Word-by-word blur-and-slide reveal (pattern from 21st Text Reveal, id 23571). */
export function RevealText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
  as: Tag = "span",
  immediate = false,
}: {
  text: string;
  className?: string;
  /** Gradient-text classes must go here: background-clip:text on the parent doesn't paint transformed children. */
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const reduced = useReducedMotion();
  const show = immediate || inView;
  const words = text.split(" ");

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden
          className={cn("inline-block whitespace-pre", wordClassName)}
          initial={reduced ? false : { opacity: 0, y: "0.4em", filter: "blur(10px)" }}
          animate={show ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.8, ease: EASE, delay: delay + i * stagger }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}

export function BlurReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Pointer-tracked border glow (pattern from 21st Glowing Effect, id 1567). */
export function GlowCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn("intel-glass intel-glow-card", className)}
      style={style}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
        el.style.setProperty("--glow-opacity", "1");
      }}
      onPointerLeave={() => ref.current?.style.setProperty("--glow-opacity", "0")}
    >
      {children}
    </div>
  );
}

export function SampleTag({ className }: { className?: string }) {
  return (
    <span className={cn("intel-sample-tag", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--intel-amber)]" aria-hidden />
      {SAMPLE_DATA_LABEL}
    </span>
  );
}

export function SectionHeader({
  index,
  kicker,
  title,
  body,
  sample = false,
  className,
}: {
  index: string;
  kicker: string;
  title: string;
  body?: string;
  sample?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <BlurReveal>
        <div className="flex flex-wrap items-center gap-3">
          <span className="intel-label">
            <span className="text-primary">{index}</span> // {kicker}
          </span>
          {sample && <SampleTag />}
        </div>
      </BlurReveal>
      <RevealText
        as="h2"
        text={title}
        className="intel-heading mt-3 block text-[1.75rem] leading-[1.05] sm:text-3xl lg:text-[2.35rem]"
        wordClassName="intel-gradient-text"
      />
      {body && (
        <BlurReveal delay={0.15}>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-[15px]">{body}</p>
        </BlurReveal>
      )}
    </div>
  );
}

export function Counter({ value, className, duration = 1.6 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display.toLocaleString("en-IN")}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: "high" | "medium" | "low" }) {
  const styles = {
    high: "border-[color:var(--intel-red)]/40 bg-[color:var(--intel-red)]/10 text-[#fca5a5]",
    medium: "border-[color:var(--intel-amber)]/40 bg-[color:var(--intel-amber)]/10 text-[#fcd34d]",
    low: "border-[color:var(--intel-green)]/30 bg-[color:var(--intel-green)]/10 text-[#6ee7b7]",
  }[risk];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase", styles)}>
      {risk}
    </span>
  );
}
