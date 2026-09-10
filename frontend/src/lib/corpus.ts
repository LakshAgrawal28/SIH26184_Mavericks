import { API_URL } from "@/lib/api";

export type CorpusDemo = {
  file: string;
  scanName: string;
  description: string;
  tag: string;
};

export const QUICK_START_CORPUS: CorpusDemo[] = [
  {
    file: "mixed-enterprise.zip",
    scanName: "mixed-enterprise-demo",
    description: "Java RSA, nginx TLS 1.0, expiring cert, native library",
    tag: "Enterprise",
  },
  {
    file: "java-rsa-aes.zip",
    scanName: "java-rsa-aes-demo",
    description: "Classic JCA RSA/ECB patterns in Java source",
    tag: "Java",
  },
  {
    file: "python-crypto.zip",
    scanName: "python-crypto-demo",
    description: "hashlib and legacy Python crypto usage",
    tag: "Python",
  },
  {
    file: "weak-configs.zip",
    scanName: "weak-configs-demo",
    description: "TLS and nginx configuration weaknesses",
    tag: "Config",
  },
];

export function corpusDemoHref(file: string): string {
  return `/scans/new?demo=${encodeURIComponent(file)}`;
}

export function findCorpusDemo(file: string): CorpusDemo | undefined {
  return QUICK_START_CORPUS.find((item) => item.file === file);
}

export async function fetchCorpusDemo(file: string): Promise<File> {
  const res = await fetch(`${API_URL}/api/v1/corpus/${encodeURIComponent(file)}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Failed to load ${file}`);
  }
  const blob = await res.blob();
  return new File([blob], file, { type: "application/zip" });
}
