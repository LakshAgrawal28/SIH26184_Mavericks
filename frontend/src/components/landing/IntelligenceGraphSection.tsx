"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { HoveredNode } from "@/components/landing/IntelligenceGraphScene";
import { SectionHeader } from "@/components/landing/primitives";
import { ARTEFACT_KIND_LABEL, GRAPH_CHAIN, GRAPH_CHAIN_EDGES } from "@/lib/landingDemoData";

const IntelligenceGraphScene = dynamic(() => import("@/components/landing/IntelligenceGraphScene"), {
  ssr: false,
  loading: () => <GraphPoster />,
});

const byId = Object.fromEntries(GRAPH_CHAIN.map((n) => [n.id, n]));

/** Static 2D stand-in used while the 3D scene loads and under reduced motion. */
function GraphPoster() {
  const pos: Record<string, [number, number]> = {
    cert: [10, 35],
    tls: [30, 50],
    rsa: [52, 30],
    aes: [52, 70],
    "svc-pay": [80, 26],
    "svc-auth": [80, 74],
  };
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      {GRAPH_CHAIN_EDGES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={pos[a][0]}
          y1={pos[a][1]}
          x2={pos[b][0]}
          y2={pos[b][1]}
          stroke="rgba(125,211,252,0.5)"
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {GRAPH_CHAIN.map((n) => (
        <circle
          key={n.id}
          cx={pos[n.id][0]}
          cy={pos[n.id][1]}
          r="0.9"
          fill={n.quantumVulnerable ? "#f87171" : "#38bdf8"}
        />
      ))}
    </svg>
  );
}

export function IntelligenceGraphSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "200px 0px" });
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<HoveredNode | null>(null);

  return (
    <section id="graph" className="landing-section pb-12 sm:pb-16">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionHeader
          index="06"
          kicker="Cryptographic intelligence graph"
          title="See how one weak key reaches every service."
          body="ECDAT links certificates, protocols, algorithms, keys and the services that depend on them — so a single quantum-vulnerable primitive shows its full blast radius. Hover a node."
          sample
        />
      </div>

      <div ref={ref} className="relative mx-auto mt-8 h-[400px] max-w-[1280px] overflow-hidden sm:mt-10 sm:h-[500px] lg:h-[540px]">
        <div className="intel-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(56,189,248,0.08),transparent_70%)]"
          aria-hidden
        />
        {inView && !reduced ? <IntelligenceGraphScene onHover={setHovered} /> : <GraphPoster />}

        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.id}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="intel-glass pointer-events-none absolute z-10 w-56 p-4"
              style={{ left: Math.min(hovered.screenX + 18, 1200), top: Math.max(hovered.screenY - 20, 10) }}
            >
              <p className="font-mono text-sm text-foreground">{hovered.label}</p>
              <dl className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Type</dt>
                  <dd className="text-foreground/90">
                    {hovered.kind === "service" ? "Service" : ARTEFACT_KIND_LABEL[hovered.kind]}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Usage</dt>
                  <dd className="truncate text-right text-foreground/90">{hovered.usage}</dd>
                </div>
              </dl>
              <p
                className={`mt-3 font-mono text-[10px] tracking-[0.14em] uppercase ${
                  hovered.quantumVulnerable ? "text-[#fca5a5]" : "text-[#6ee7b7]"
                }`}
              >
                {hovered.quantumVulnerable ? "⚠ Quantum-vulnerable" : "Quantum-resistant at current size"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-wrap justify-center gap-2 px-6">
          {GRAPH_CHAIN_EDGES.slice(0, 3).map(([a, b]) => (
            <span key={`${a}${b}`} className="intel-sample-tag bg-background/60">
              {byId[a].label} → {byId[b].label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
