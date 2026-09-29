"use client";

import { useEffect, useRef } from "react";
import type { ArtefactKind } from "@/lib/landingDemoData";
import { cn } from "@/lib/utils";

type NetNode = {
  x: number;
  y: number;
  depth: number;
  kind: ArtefactKind | "core";
  label?: string;
  appearAt: number;
};

type NetEdge = { a: number; b: number; drawAt: number };

const KIND_COLOR: Record<NetNode["kind"], string> = {
  core: "125,211,252",
  algorithm: "56,189,248",
  key: "96,165,250",
  certificate: "147,197,253",
  protocol: "34,211,238",
  library: "129,140,248",
  cloud: "186,230,253",
  hsm: "245,165,36",
};

const LABELS: { kind: ArtefactKind; label: string }[] = [
  { kind: "algorithm", label: "RSA-2048" },
  { kind: "algorithm", label: "AES-256" },
  { kind: "algorithm", label: "ECDSA-P256" },
  { kind: "key", label: "KMS key" },
  { kind: "certificate", label: "X.509" },
  { kind: "protocol", label: "TLS 1.2" },
  { kind: "library", label: "OpenSSL" },
  { kind: "cloud", label: "Cloud KMS" },
  { kind: "hsm", label: "HSM" },
];

const KINDS: ArtefactKind[] = ["algorithm", "key", "certificate", "protocol", "library", "cloud", "hsm"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNetwork(count: number, seed: number) {
  const rand = mulberry32(seed);
  const nodes: NetNode[] = [{ x: 0.5, y: 0.5, depth: 1, kind: "core", label: "ECDAT", appearAt: 0 }];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 0.12 + Math.pow(rand(), 0.8) * 0.48;
    const labelled = i < LABELS.length ? LABELS[i] : undefined;
    nodes.push({
      x: 0.5 + Math.cos(angle) * radius * 1.35,
      y: 0.5 + Math.sin(angle) * radius * 0.85,
      depth: 0.35 + rand() * 0.65,
      kind: labelled?.kind ?? KINDS[Math.floor(rand() * KINDS.length)],
      label: labelled?.label,
      appearAt: 250 + radius * 1400 + rand() * 300,
    });
  }

  const edges: NetEdge[] = [];
  const seen = new Set<string>();
  nodes.forEach((n, i) => {
    const nearest = nodes
      .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const { j } of nearest) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: i, b: j, drawAt: Math.max(nodes[i].appearAt, nodes[j].appearAt) + 250 });
    }
  });
  // Spokes from the core to the labelled artefacts.
  for (let i = 1; i <= LABELS.length; i++) {
    edges.push({ a: 0, b: i, drawAt: nodes[i].appearAt + 350 });
  }
  return { nodes, edges };
}

type Packet = { edge: number; t: number; speed: number; forward: boolean };

type HeroNetworkProps = {
  className?: string;
  /** "reconstruct" slows the boot sequence for the closing CTA. */
  variant?: "hero" | "reconstruct" | "static";
  density?: number;
};

export function HeroNetwork({ className, variant = "hero", density = 46 }: HeroNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isStatic = reduced || variant === "static";
    const timeScale = variant === "reconstruct" ? 2.6 : 1;
    const { nodes, edges } = buildNetwork(density, variant === "reconstruct" ? 11 : 7);
    const packets: Packet[] = [];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    // The boot sequence starts the first time the canvas scrolls into view.
    let visible = false;
    let start = 0;
    let pointerX = 0;
    let pointerY = 0;
    let parX = 0;
    let parY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (n: NetNode) => ({
      x: n.x * width + parX * 54 * n.depth,
      y: n.y * height + parY * 38 * n.depth,
    });

    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed / timeScale;

      for (const e of edges) {
        const progress = Math.min(1, Math.max(0, (t - e.drawAt) / 500));
        if (progress <= 0) continue;
        const a = project(nodes[e.a]);
        const b = project(nodes[e.b]);
        const isSpoke = e.a === 0;
        ctx.strokeStyle = isSpoke ? "rgba(56,189,248,0.22)" : "rgba(148,170,200,0.11)";
        ctx.lineWidth = isSpoke ? 1 : 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress);
        ctx.stroke();
      }

      for (const p of packets) {
        const e = edges[p.edge];
        const a = project(nodes[p.forward ? e.a : e.b]);
        const b = project(nodes[p.forward ? e.b : e.a]);
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 6);
        grad.addColorStop(0, "rgba(186,230,253,0.95)");
        grad.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const n of nodes) {
        const appear = Math.min(1, Math.max(0, (t - n.appearAt) / 450));
        if (appear <= 0) continue;
        const { x, y } = project(n);
        const rgb = KIND_COLOR[n.kind];
        const isCore = n.kind === "core";
        const r = (isCore ? 5 : n.label ? 3.2 : 1.6 + n.depth * 1.3) * (0.6 + appear * 0.4);
        const alpha = appear * (0.35 + n.depth * 0.65);

        if (isCore || n.label) {
          const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
          halo.addColorStop(0, `rgba(${rgb},${0.28 * appear})`);
          halo.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(x, y, r * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.beginPath();
        if (n.kind === "certificate" || n.kind === "hsm") {
          ctx.rect(x - r, y - r, r * 2, r * 2);
        } else if (n.kind === "protocol") {
          ctx.moveTo(x, y - r * 1.2);
          ctx.lineTo(x + r * 1.2, y);
          ctx.lineTo(x, y + r * 1.2);
          ctx.lineTo(x - r * 1.2, y);
          ctx.closePath();
        } else {
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();

        if (n.label) {
          ctx.font = `${isCore ? 600 : 500} ${isCore ? 11 : 10}px "IBM Plex Mono", ui-monospace, monospace`;
          ctx.fillStyle = `rgba(${isCore ? "230,237,245" : "135,147,166"},${appear * (isCore ? 0.95 : 0.8)})`;
          ctx.fillText(n.label, x + r + 7, y + 3.5);
        }
      }
    };

    const flowStart = 2600;
    const tick = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      parX += (pointerX - parX) * 0.08;
      parY += (pointerY - parY) * 0.08;

      if (elapsed / timeScale > flowStart && packets.length < 14 && Math.random() < 0.08) {
        packets.push({
          edge: Math.floor(Math.random() * edges.length),
          t: 0,
          speed: 0.004 + Math.random() * 0.006,
          forward: Math.random() > 0.5,
        });
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].t += packets[i].speed;
        if (packets[i].t >= 1) packets.splice(i, 1);
      }

      draw(elapsed);
      if (visible) raf = requestAnimationFrame(tick);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (isStatic) draw(1e6);
    });
    ro.observe(canvas);

    if (isStatic) {
      draw(1e6);
      return () => ro.disconnect();
    }

    const onPointer = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      io.disconnect();
      ro.disconnect();
    };
  }, [variant, density]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} aria-hidden />;
}
