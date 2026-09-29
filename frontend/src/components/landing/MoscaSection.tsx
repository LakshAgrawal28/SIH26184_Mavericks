"use client";

import { useRef } from "react";
import { useGSAP } from "@/components/landing/useGsap";
import { SampleTag } from "@/components/landing/primitives";
import { MOSCA_HORIZON_YEARS, MOSCA_ROWS, MOSCA_Z_YEARS } from "@/lib/landingDemoData";

const W = 1000;
const LEFT = 40;
const RIGHT = 960;
const ROW_H = 96;
const TOP = 70;
const H = TOP + MOSCA_ROWS.length * ROW_H + 50;

const yearX = (years: number) => LEFT + ((RIGHT - LEFT) * years) / MOSCA_HORIZON_YEARS;

export function MoscaSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(root, (gsap) => {
    gsap.set("[data-z-line]", { scaleY: 0, transformOrigin: "50% 0%" });
    gsap.set("[data-y], [data-x]", { scaleX: 0, transformOrigin: "0% 50%", transformBox: "fill-box" });
    gsap.set("[data-label], [data-y-text], [data-x-text], [data-exposure], [data-verdict]", {
      opacity: 0,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "[data-mosca-pin]",
        start: "top top",
        end: "+=1100",
        scrub: 0.55,
        pin: true,
        anticipatePin: 1,
      },
    });
    tl.fromTo("[data-z-line]", { scaleY: 0 }, { scaleY: 1, transformOrigin: "50% 0%", duration: 0.6 });
    MOSCA_ROWS.forEach((_, i) => {
      const row = `[data-row="${i}"]`;
      tl.fromTo(`${row} [data-label]`, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.3 })
        .fromTo(`${row} [data-y]`, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.6 })
        .fromTo(`${row} [data-y-text]`, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "-=0.2")
        .fromTo(`${row} [data-x]`, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.8 })
        .fromTo(`${row} [data-x-text]`, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "-=0.2")
        .fromTo(`${row} [data-exposure]`, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .fromTo(`${row} [data-verdict]`, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 }, "<");
    });
  });

  return (
    <section id="risk" ref={root} className="landing-section !py-10 sm:!py-12">
      <div data-mosca-pin className="flex min-h-0 items-center py-12 sm:py-14">
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:items-center">
            <div>
              <p className="intel-label">
                <span className="text-primary">05</span> // Quantum risk engine
              </p>
              <h2 className="intel-heading intel-gradient-text mt-3 text-[1.65rem] sm:text-3xl">
                When does your data become readable?
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink-muted">
                ECDAT applies Mosca&apos;s inequality to every asset. If the years your data must stay secret{" "}
                <span className="font-mono text-foreground">(X)</span> plus the years it takes to migrate{" "}
                <span className="font-mono text-foreground">(Y)</span> exceed the years until a cryptographically
                relevant quantum computer <span className="font-mono text-foreground">(Z)</span>, that data is
                already exposed to harvest-now, decrypt-later.
              </p>
              <p className="mt-6 inline-flex rounded-lg border border-border bg-white/[0.03] px-4 py-2 font-mono text-sm text-foreground">
                X + Y &gt; Z <span className="mx-2 text-ink-muted">⇒</span>
                <span className="text-destructive">exposure</span>
              </p>
              <div className="mt-6">
                <SampleTag />
              </div>
            </div>

            <div className="intel-glass overflow-x-auto p-4 sm:p-6">
              <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px]" role="img" aria-label="Mosca timeline for three sample assets">
                <defs>
                  <linearGradient id="mosca-y" x1="0" x2="1">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#3b82f6" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="mosca-x" x1="0" x2="1">
                    <stop offset="0" stopColor="#0d3b66" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#7dd3fc" stopOpacity="0.9" />
                  </linearGradient>
                  <pattern id="mosca-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="3" height="8" fill="rgba(239,68,68,0.55)" />
                  </pattern>
                  <pattern id="mosca-hatch-amber" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="3" height="8" fill="rgba(245,165,36,0.5)" />
                  </pattern>
                </defs>

                {Array.from({ length: MOSCA_HORIZON_YEARS / 2 + 1 }, (_, i) => i * 2).map((yr) => (
                  <g key={yr}>
                    <line x1={yearX(yr)} x2={yearX(yr)} y1={TOP - 20} y2={H - 40} stroke="rgba(148,170,200,0.07)" />
                    <text x={yearX(yr)} y={H - 18} textAnchor="middle" className="fill-[#8793a6] font-mono text-[13px]">
                      {yr === 0 ? "TODAY" : `+${yr}y`}
                    </text>
                  </g>
                ))}

                <g data-z-line>
                  <line
                    x1={yearX(MOSCA_Z_YEARS)}
                    x2={yearX(MOSCA_Z_YEARS)}
                    y1={TOP - 40}
                    y2={H - 40}
                    stroke="#f5a524"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                  />
                  <text x={yearX(MOSCA_Z_YEARS) + 8} y={TOP - 28} className="fill-[#fcd34d] font-mono text-[13px] tracking-[0.12em]">
                    Z · QUANTUM THRESHOLD (+{MOSCA_Z_YEARS}y, scenario)
                  </text>
                </g>

                {MOSCA_ROWS.map((row, i) => {
                  const y0 = TOP + i * ROW_H;
                  const total = row.x + row.y;
                  const exposed = total > MOSCA_Z_YEARS;
                  const shor = row.threat === "shor";
                  const barY = y0 + 30;
                  return (
                    <g key={row.asset} data-row={i}>
                      <g data-label>
                        <text x={LEFT} y={y0 + 14} className="fill-[#e6edf5] font-mono text-[15px]">
                          {row.asset}
                        </text>
                        <text x={LEFT} y={barY + 44} className="fill-[#8793a6] text-[12px]">
                          {row.note}
                        </text>
                      </g>
                      <rect data-y x={yearX(0)} y={barY} width={yearX(row.y) - yearX(0)} height={18} rx={3} fill="url(#mosca-y)" />
                      <text data-y-text x={yearX(0) + 8} y={barY + 13} className="pointer-events-none fill-white font-mono text-[11px]">
                        Y {row.y}y
                      </text>
                      <rect data-x x={yearX(row.y)} y={barY} width={yearX(total) - yearX(row.y)} height={18} rx={3} fill="url(#mosca-x)" />
                      <text data-x-text x={yearX(row.y) + 8} y={barY + 13} className="pointer-events-none fill-[#03101a] font-mono text-[11px]">
                        X {row.x}y
                      </text>
                      {exposed && (
                        <rect
                          data-exposure
                          x={yearX(MOSCA_Z_YEARS)}
                          y={barY - 4}
                          width={yearX(total) - yearX(MOSCA_Z_YEARS)}
                          height={26}
                          rx={3}
                          fill={shor ? "url(#mosca-hatch)" : "url(#mosca-hatch-amber)"}
                          stroke={shor ? "#ef4444" : "#f5a524"}
                          strokeWidth="1"
                        />
                      )}
                      <text
                        data-verdict
                        x={RIGHT}
                        y={y0 + 14}
                        textAnchor="end"
                        className={`font-mono text-[12px] tracking-[0.14em] ${
                          !exposed ? "fill-[#1B7A3D]" : shor ? "fill-[#c41e1e]" : "fill-[#a66b12]"
                        }`}
                      >
                        {!exposed
                          ? "WITHIN WINDOW"
                          : shor
                            ? `⚠ EXPOSURE ${total - MOSCA_Z_YEARS}y`
                            : "REDUCED MARGIN"}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
