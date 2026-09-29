"use client";

import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { GRAPH_CHAIN, GRAPH_CHAIN_EDGES, type GraphNode } from "@/lib/landingDemoData";

export type HoveredNode = GraphNode & { screenX: number; screenY: number };

const CHAIN_POS: Record<string, [number, number, number]> = {
  cert: [-3.4, 1.1, 0.2],
  tls: [-1.6, 0.2, 0.6],
  rsa: [0.2, 1.2, 0.1],
  aes: [0.2, -0.9, 0.4],
  "svc-pay": [2.2, 1.4, -0.2],
  "svc-auth": [2.2, -1.1, 0.1],
};

const SECONDARY_LABELS: Omit<GraphNode, "id">[] = [
  { label: "ECDSA-P256", kind: "algorithm", usage: "JWT signing", quantumVulnerable: true },
  { label: "SHA-256", kind: "algorithm", usage: "Integrity", quantumVulnerable: false },
  { label: "MD5", kind: "algorithm", usage: "Legacy fingerprint", quantumVulnerable: false },
  { label: "TLS 1.0", kind: "protocol", usage: "Legacy listener", quantumVulnerable: true },
  { label: "OpenSSL 1.0.2", kind: "library", usage: "Native binary", quantumVulnerable: true },
  { label: "passlib", kind: "library", usage: "Password hashing", quantumVulnerable: false },
  { label: "KMS data key", kind: "key", usage: "Envelope encryption", quantumVulnerable: false },
  { label: "RSA 4096 key", kind: "key", usage: "Code signing", quantumVulnerable: true },
  { label: "Cloud KMS", kind: "cloud", usage: "Key custody", quantumVulnerable: false },
  { label: "HSM slot 2", kind: "hsm", usage: "Root CA key", quantumVulnerable: true },
  { label: "X.509 intermediate", kind: "certificate", usage: "Issuing CA", quantumVulnerable: true },
  { label: "SSH host key", kind: "key", usage: "Ops access", quantumVulnerable: true },
  { label: "AES-128-CBC", kind: "algorithm", usage: "Backups", quantumVulnerable: false },
  { label: "HMAC-SHA1", kind: "algorithm", usage: "Webhook auth", quantumVulnerable: false },
  { label: "ECDH P-384", kind: "algorithm", usage: "VPN key exchange", quantumVulnerable: true },
  { label: "crypto/tls", kind: "library", usage: "Go client", quantumVulnerable: true },
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useField(count: number) {
  return useMemo(() => {
    const rand = mulberry32(26164);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 2.2 + rand() * 4.2;
      points.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta) * 1.6,
          r * Math.sin(phi) * Math.sin(theta) * 0.7,
          r * Math.cos(phi) * 0.9 - 1.5
        )
      );
    }
    const segs: number[] = [];
    points.forEach((p, i) => {
      for (let j = i + 1; j < points.length; j++) {
        if (p.distanceToSquared(points[j]) < 0.9) {
          segs.push(p.x, p.y, p.z, points[j].x, points[j].y, points[j].z);
        }
      }
    });
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    return { points, lines };
  }, [count]);
}

function FieldNodes({ points }: { points: THREE.Vector3[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      const s = 0.018 + ((i * 37) % 10) * 0.003;
      m.makeScale(s, s, s).setPosition(p);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [points]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#7dd3fc" transparent opacity={0.55} />
    </instancedMesh>
  );
}

type Hover = (node: HoveredNode | null) => void;

function LabelledNode({
  node,
  position,
  primary,
  onHover,
}: {
  node: GraphNode;
  position: [number, number, number];
  primary: boolean;
  onHover: Hover;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const hovered = useRef(false);
  const color = node.quantumVulnerable ? (primary ? "#f87171" : "#fb923c") : "#38bdf8";

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const target = hovered.current ? 1.8 : 1;
    mesh.scale.setScalar(mesh.scale.x + (target - mesh.scale.x) * 0.15);
  });

  const report = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    onHover({ ...node, screenX: e.nativeEvent.offsetX, screenY: e.nativeEvent.offsetY });
  };

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={report}
        onPointerMove={report}
        onPointerOut={() => {
          hovered.current = false;
          onHover(null);
        }}
      >
        <sphereGeometry args={[primary ? 0.11 : 0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[primary ? 0.26 : 0.14, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <Html position={[0.16, 0.04, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <span
          className={
            primary
              ? "font-mono text-[11px] whitespace-nowrap text-foreground"
              : "font-mono text-[9px] whitespace-nowrap text-ink-muted/80"
          }
        >
          {node.label}
        </span>
      </Html>
    </group>
  );
}

function ChainEdges() {
  const geometry = useMemo(() => {
    const segs: number[] = [];
    for (const [a, b] of GRAPH_CHAIN_EDGES) {
      segs.push(...CHAIN_POS[a], ...CHAIN_POS[b]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#7dd3fc" transparent opacity={0.85} />
    </lineSegments>
  );
}

/** Keeps the ~7-unit-wide chain inside narrow (portrait) viewports. */
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.position.z = aspect < 1.4 ? 7.5 * (1.4 / aspect) * 0.85 : 7.5;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function Rig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += (state.pointer.x * 0.35 - g.rotation.y) * 0.04;
    g.rotation.x += (-state.pointer.y * 0.18 - g.rotation.x) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

export default function IntelligenceGraphScene({ onHover }: { onHover: Hover }) {
  const { points, lines } = useField(300);
  const secondary = useMemo(() => {
    const rand = mulberry32(7);
    return SECONDARY_LABELS.map((n, i) => {
      const p = points[Math.floor(rand() * points.length)];
      return { node: { ...n, id: `s${i}` }, position: [p.x, p.y, p.z] as [number, number, number] };
    });
  }, [points]);

  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onHover(null)}
    >
      <ResponsiveCamera />
      <fog attach="fog" args={["#05070b", 6, 18]} />
      <Rig>
        <FieldNodes points={points} />
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.08} />
        </lineSegments>
        <ChainEdges />
        {GRAPH_CHAIN.map((n) => (
          <LabelledNode key={n.id} node={n} position={CHAIN_POS[n.id]} primary onHover={onHover} />
        ))}
        {secondary.map(({ node, position }) => (
          <LabelledNode key={node.id} node={node} position={position} primary={false} onHover={onHover} />
        ))}
      </Rig>
    </Canvas>
  );
}
