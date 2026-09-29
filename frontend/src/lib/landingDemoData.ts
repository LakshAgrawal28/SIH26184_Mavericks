/**
 * Illustrative values for the marketing landing page. They mirror the
 * bundled `mixed-enterprise.zip` corpus but are NOT live product metrics —
 * every section that renders them must show the SAMPLE_DATA_LABEL tag.
 */

export const SAMPLE_DATA_LABEL = "Sample data · mixed-enterprise demo";

export type ArtefactKind =
  | "algorithm"
  | "key"
  | "certificate"
  | "protocol"
  | "library"
  | "cloud"
  | "hsm";

export type Risk = "high" | "medium" | "low";

export const ARTEFACT_KIND_LABEL: Record<ArtefactKind, string> = {
  algorithm: "Algorithm",
  key: "Key",
  certificate: "Certificate",
  protocol: "Protocol",
  library: "Library",
  cloud: "Cloud service",
  hsm: "HSM",
};

export const SCAN_SOURCES = [
  { id: "repo", label: "Source repository", detail: "src/ · services/ · go/ · python/", progress: 78 },
  { id: "binary", label: "Binary", detail: "lib/libcrypto_legacy.so", progress: 91 },
  { id: "library", label: "Library", detail: "package-lock.json · OpenSSL", progress: 86 },
  { id: "container", label: "Container image", detail: "conf/nginx.conf · certs/", progress: 64 },
] as const;

export const DISCOVERY_CATEGORIES = [
  { id: "algorithms", label: "Algorithms", count: 72, samples: ["RSA-2048", "AES-256-GCM", "ECDSA-P256", "SHA-256"] },
  { id: "certificates", label: "Certificates", count: 48, samples: ["expiring-rsa.pem", "X.509 v3"] },
  { id: "protocols", label: "Protocols", count: 39, samples: ["TLS 1.0", "TLS 1.2", "JWT RS256"] },
  { id: "libraries", label: "Libraries", count: 218, samples: ["OpenSSL 1.0.2", "passlib", "crypto/tls"] },
  { id: "keys", label: "Keys", count: 236, samples: ["RSA 2048-bit", "KMS data key"] },
] as const;

export const DISCOVERY_TOTAL = DISCOVERY_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

export type DiscoveredArtefact = {
  name: string;
  kind: ArtefactKind;
  category: (typeof DISCOVERY_CATEGORIES)[number]["id"];
  path: string;
  risk: Risk;
};

export const DISCOVERED_ARTEFACTS: DiscoveredArtefact[] = [
  { name: "RSA-2048", kind: "algorithm", category: "algorithms", path: "src/CryptoService.java:11", risk: "high" },
  { name: "RSA/ECB/PKCS1", kind: "algorithm", category: "algorithms", path: "src/CryptoService.java:12", risk: "high" },
  { name: "TLS 1.0", kind: "protocol", category: "protocols", path: "conf/nginx.conf:18", risk: "high" },
  { name: "InsecureSkipVerify", kind: "protocol", category: "protocols", path: "go/insecure_tls.go:11", risk: "high" },
  { name: "MD5", kind: "algorithm", category: "algorithms", path: "src/CryptoService.java:17", risk: "medium" },
  { name: "RSA cert · 14d", kind: "certificate", category: "certificates", path: "certs/expiring-rsa.pem", risk: "medium" },
  { name: "libcrypto 1.0.2", kind: "library", category: "libraries", path: "lib/libcrypto_legacy.so", risk: "medium" },
  { name: "JWT RS256", kind: "key", category: "keys", path: "services/kms_jwt_tls.py:23", risk: "high" },
];

export const FILE_TREE = [
  { depth: 0, name: "mixed-enterprise/", dir: true },
  { depth: 1, name: "src/", dir: true },
  { depth: 2, name: "CryptoService.java", dir: false, focus: true },
  { depth: 1, name: "services/", dir: true },
  { depth: 2, name: "kms_jwt_tls.py", dir: false },
  { depth: 1, name: "go/", dir: true },
  { depth: 2, name: "insecure_tls.go", dir: false },
  { depth: 1, name: "conf/", dir: true },
  { depth: 2, name: "nginx.conf", dir: false },
  { depth: 1, name: "lib/", dir: true },
  { depth: 2, name: "libcrypto_legacy.so", dir: false },
] as const;

export const CBOM_SOURCE_FILE = "CryptoService.java";

export const CBOM_CODE_LINES = [
  { n: 10, code: 'KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");', hit: null },
  { n: 11, code: "kpg.initialize(2048);", hit: "rsa" },
  { n: 12, code: 'Cipher.getInstance("RSA/ECB/PKCS1Padding");', hit: null },
  { n: 17, code: 'MessageDigest.getInstance("MD5");', hit: "md5" },
  { n: 23, code: 'Cipher.getInstance("AES/CBC/PKCS5Padding");', hit: "aes" },
] as const;

export const CBOM_ARTEFACTS = [
  { id: "rsa", name: "RSA-2048", usage: "Secret wrapping · L11", risk: "high" as Risk },
  { id: "md5", name: "MD5", usage: "Fingerprint digest · L17", risk: "medium" as Risk },
  { id: "aes", name: "AES-CBC", usage: "Legacy payload cipher · L23", risk: "low" as Risk },
];

export const CBOM_ENTRY = {
  bomRef: "crypto-asset:rsa-2048",
  name: "RSA-2048",
  assetType: "algorithm",
  primitive: "pke",
  keySize: "2048 bits",
  usage: "Key transport (RSA/ECB/PKCS1)",
  evidence: "src/CryptoService.java:11",
  quantumSecurityLevel: 0,
  risk: "HIGH" as const,
};

/** Mosca's inequality: exposed when X (shelf life) + Y (migration) > Z (time to CRQC). Years from today. */
export const MOSCA_HORIZON_YEARS = 20;
export const MOSCA_Z_YEARS = 10;

export const MOSCA_ROWS = [
  { asset: "RSA-2048 · TLS key exchange", x: 8, y: 4, threat: "shor", note: "Shor-breakable; recorded sessions stay sensitive for years" },
  { asset: "ECDSA-P256 · JWT signing", x: 3, y: 3, threat: "shor", note: "Shor-breakable, but short-lived tokens finish inside the window" },
  { asset: "AES-128 · backups", x: 12, y: 2, threat: "grover", note: "Grover halves effective strength; move to AES-256" },
] as const;

export const PQC_CANDIDATES = [
  {
    id: "mlkem",
    name: "ML-KEM-768",
    standard: "FIPS 203",
    role: "Key encapsulation for TLS / key transport",
    security: "NIST level 3",
    latency: "Low",
    cost: "Larger public keys (~1.2 KB)",
  },
  {
    id: "mldsa",
    name: "ML-DSA-65",
    standard: "FIPS 204",
    role: "Signatures for certificates / JWT",
    security: "NIST level 3",
    latency: "Low",
    cost: "Larger signatures (~3.3 KB)",
  },
  {
    id: "hybrid",
    name: "X25519 + ML-KEM",
    standard: "Hybrid",
    role: "Transitional TLS 1.3 key exchange",
    security: "Classical + PQ",
    latency: "Minimal overhead",
    cost: "Dual handshake material",
  },
] as const;

export type GraphNode = {
  id: string;
  label: string;
  kind: ArtefactKind | "service";
  usage: string;
  quantumVulnerable: boolean;
};

export const GRAPH_CHAIN: GraphNode[] = [
  { id: "cert", label: "expiring-rsa.pem", kind: "certificate", usage: "Server certificate", quantumVulnerable: true },
  { id: "tls", label: "TLS 1.2", kind: "protocol", usage: "nginx listener :443", quantumVulnerable: true },
  { id: "rsa", label: "RSA-2048", kind: "algorithm", usage: "Key exchange", quantumVulnerable: true },
  { id: "aes", label: "AES-256-GCM", kind: "algorithm", usage: "Bulk encryption", quantumVulnerable: false },
  { id: "svc-pay", label: "payments-api", kind: "service", usage: "Consumes TLS session", quantumVulnerable: true },
  { id: "svc-auth", label: "auth-service", kind: "service", usage: "JWT issuer", quantumVulnerable: true },
];

export const GRAPH_CHAIN_EDGES: [string, string][] = [
  ["cert", "tls"],
  ["tls", "rsa"],
  ["tls", "aes"],
  ["rsa", "svc-pay"],
  ["aes", "svc-auth"],
];
