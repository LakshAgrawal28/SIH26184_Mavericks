"use client";

import "@xyflow/react/dist/style.css";
import {
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RiskBadge, SectionHeader } from "@/components/landing/primitives";
import {
  CBOM_ARTEFACTS,
  CBOM_CODE_LINES,
  CBOM_ENTRY,
  CBOM_SOURCE_FILE,
  FILE_TREE,
  type Risk,
} from "@/lib/landingDemoData";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const LINE_H = 30;
const HEADER_H = 40;

const handleStyle = { opacity: 0, width: 6, height: 6, border: 0 };

function CodeNode({ data }: NodeProps<Node<{ active: boolean }>>) {
  return (
    <div className="intel-glass w-[380px] overflow-hidden font-mono text-[11px]">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4 text-ink-muted">
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="ml-2 text-foreground/80">src/{CBOM_SOURCE_FILE}</span>
      </div>
      {CBOM_CODE_LINES.map((line) => (
        <div
          key={line.n}
          className={cn(
            "relative flex items-center gap-3 px-4 transition-colors duration-500",
            data.active && line.hit ? "bg-primary/10 text-foreground" : "text-foreground/60"
          )}
          style={{ height: LINE_H }}
        >
          <span className="w-5 text-right text-ink-muted/60">{line.n}</span>
          <span className="truncate">{line.code}</span>
        </div>
      ))}
      {CBOM_CODE_LINES.map((line, i) =>
        line.hit ? (
          <Handle
            key={line.hit}
            id={line.hit}
            type="source"
            position={Position.Right}
            style={{ ...handleStyle, top: HEADER_H + i * LINE_H + LINE_H / 2 }}
          />
        ) : null
      )}
    </div>
  );
}

const hiddenState = { opacity: 0, x: -16, filter: "blur(6px)" };
const shownState = { opacity: 1, x: 0, filter: "blur(0px)" };

function ArtefactNode({ data }: NodeProps<Node<{ name: string; usage: string; risk: Risk; visible: boolean }>>) {
  return (
    <motion.div
      initial={hiddenState}
      animate={data.visible ? shownState : hiddenState}
      transition={{ duration: 0.6, ease: EASE }}
      className="intel-glass flex w-[210px] items-center justify-between gap-3 px-4 py-3"
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div>
        <p className="font-mono text-sm text-foreground">{data.name}</p>
        <p className="mt-0.5 font-mono text-[10px] text-ink-muted">{data.usage}</p>
      </div>
      <RiskBadge risk={data.risk} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </motion.div>
  );
}

function CbomNode({ data }: NodeProps<Node<{ visible: boolean }>>) {
  const rows: [string, string][] = [
    ["bom-ref", CBOM_ENTRY.bomRef],
    ["assetType", CBOM_ENTRY.assetType],
    ["primitive", CBOM_ENTRY.primitive],
    ["keySize", CBOM_ENTRY.keySize],
    ["usage", CBOM_ENTRY.usage],
    ["evidence", CBOM_ENTRY.evidence],
    ["nistQuantumLevel", String(CBOM_ENTRY.quantumSecurityLevel)],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      animate={
        data.visible
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.94, filter: "blur(8px)" }
      }
      transition={{ duration: 0.7, ease: EASE }}
      className="intel-glass w-[300px] overflow-hidden shadow-[var(--shadow-elevated)]"
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">CycloneDX 1.6 · CBOM</p>
        <span className="rounded-full border border-[color:var(--intel-red)]/35 bg-[color:var(--intel-red)]/8 px-2 py-0.5 font-mono text-[10px] text-[color:var(--intel-red)]">
          RISK: {CBOM_ENTRY.risk}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="font-mono text-lg text-foreground">{CBOM_ENTRY.name}</p>
        <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="truncate text-right text-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}

const nodeTypes = { code: CodeNode, artefact: ArtefactNode, cbom: CbomNode };

const edgeStyle = { stroke: "rgba(125,211,252,0.6)", strokeWidth: 1.4 };

export function CbomSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStage(3);
      return;
    }
    const timers = [1, 2, 3].map((s, i) => window.setTimeout(() => setStage(s), 300 + i * 1100));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduced]);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [{ id: "code", type: "code", position: { x: 0, y: 30 }, data: { active: stage >= 1 } }];
    const e: Edge[] = [];
    CBOM_ARTEFACTS.forEach((a, i) => {
      n.push({ id: a.id, type: "artefact", position: { x: 470, y: i * 92 }, data: { ...a, visible: stage >= 2 } });
      e.push({
        id: `code-${a.id}`,
        source: "code",
        sourceHandle: a.id,
        target: a.id,
        animated: true,
        hidden: stage < 2,
        style: edgeStyle,
      });
    });
    n.push({ id: "cbom", type: "cbom", position: { x: 760, y: -20 }, data: { visible: stage >= 3 } });
    e.push({
      id: "rsa-cbom",
      source: "rsa",
      target: "cbom",
      animated: true,
      hidden: stage < 3,
      style: { ...edgeStyle, stroke: "rgba(239,68,68,0.7)" },
    });
    return { nodes: n, edges: e };
  }, [stage]);

  return (
    <section id="cbom" className="landing-section">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionHeader
          index="04"
          kicker="Cryptographic bill of materials"
          title="From code to CBOM."
          body="ECDAT traces every primitive back to the line that uses it, then emits a CycloneDX 1.6 cryptographic-asset record with key size, usage, evidence and quantum risk."
          sample
        />

        <div ref={ref} className="landing-stack grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="intel-glass p-5 font-mono text-[12px]">
            <p className="intel-label mb-4 text-[10px]">Repository</p>
            <ul className="space-y-1.5">
              {FILE_TREE.map((f, i) => (
                <motion.li
                  key={f.name}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : undefined}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className={cn(
                    "truncate",
                    f.dir ? "text-ink-muted" : "text-foreground/75",
                    "focus" in f && f.focus && stage >= 1 && "text-primary"
                  )}
                  style={{ paddingLeft: f.depth * 14 }}
                >
                  {f.dir ? "▸ " : "· "}
                  {f.name}
                  {"focus" in f && f.focus && stage >= 1 && <span className="ml-2 text-[10px]">● scanning</span>}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="intel-glass relative h-[320px] overflow-hidden sm:h-[460px]">
            <div className="intel-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              colorMode="dark"
              style={{ background: "transparent" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
