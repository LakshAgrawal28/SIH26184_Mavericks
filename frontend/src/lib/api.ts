function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "http://localhost:8000";
  return raw.replace(/\/+$/, "");
}

export const API_URL = resolveApiUrl();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ecdat_token");
}

/** Cross-browser fetch timeout (AbortSignal.timeout is not universal). */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 90000
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (init.signal) {
    init.signal.addEventListener("abort", onAbort, { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
    init.signal?.removeEventListener("abort", onAbort);
  });
}

export async function pingApiHealth(timeoutMs = 60000): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/health`, { cache: "no-store" }, timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}

/** Retry until the API responds or maxAttempts is reached. */
export async function waitForApi(
  onAttempt?: (attempt: number) => void,
  maxAttempts = 20,
  delayMs = 4000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onAttempt?.(attempt);
    if (await pingApiHealth(attempt === 1 ? 90000 : 60000)) return true;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }
  return false;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const res = await fetchWithTimeout(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res as unknown as T;
}
