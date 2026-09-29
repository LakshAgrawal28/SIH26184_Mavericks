"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { API_URL, fetchWithTimeout, waitForApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiStatus = "checking" | "online" | "offline";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [wakeAttempt, setWakeAttempt] = useState(0);

  const checkApi = useCallback(async () => {
    setApiStatus("checking");
    setWakeAttempt(0);
    const online = await waitForApi(setWakeAttempt);
    setApiStatus(online ? "online" : "offline");
    return online;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const online = await waitForApi((attempt) => {
        if (!cancelled) setWakeAttempt(attempt);
      });
      if (!cancelled) setApiStatus(online ? "online" : "offline");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (apiStatus !== "online") {
        const online = await checkApi();
        if (!online) {
          throw new Error(
            "Backend is still waking up. Wait a moment, then click Retry connection or try again."
          );
        }
      }

      const res = await fetchWithTimeout(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Invalid email or password.");
        }
        throw new Error(`API error (${res.status}). Try again in a moment.`);
      }
      const data = (await res.json()) as { access_token: string };
      localStorage.setItem("ecdat_token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. The backend may still be waking — try again.");
        setApiStatus("offline");
      } else if (err instanceof TypeError) {
        setError("Cannot reach the API. Click Retry connection or wait 30–60 seconds.");
        setApiStatus("offline");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const statusMessage =
    apiStatus === "checking"
      ? wakeAttempt > 1
        ? `waking backend… (attempt ${wakeAttempt})`
        : "connecting…"
      : apiStatus === "online"
        ? "connected"
        : "unreachable — click Retry or wait for cold start";

  return (
    <MarketingLayout>
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-12 lg:grid-cols-[1fr_400px] lg:items-start lg:py-16">
        <div className="motion-enter max-w-lg">
          <Link href="/" className="text-xs text-ink-muted transition-colors hover:text-primary">
            ← Back to overview
          </Link>
          <CipherScramble className="mt-8 font-mono text-base text-foreground md:text-lg" />
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Sign in to run discovery scans, review Mosca timelines, export CBOMs, and use the
            grounded AI assistant — all tied to deterministic scan data.
          </p>
          <ul className="mt-6 space-y-2 border-l border-border pl-4 text-sm text-ink-muted">
            <li>Upload zip archives or bundled corpus demos</li>
            <li>Evidence-backed artefact inventory</li>
            <li>CycloneDX 1.6 export validation</li>
          </ul>
        </div>

        <div className="panel-elevated motion-enter motion-enter-delay-1 p-8">
          <h2 className="text-display text-xl text-foreground">Operator sign-in</h2>
          <p className="mt-1 text-sm text-ink-muted">Console access for your deployment</p>

          <div className="mt-4 flex items-center justify-between gap-2 font-mono text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  apiStatus === "online"
                    ? "border-[#1B7A3D] bg-[#1B7A3D]"
                    : apiStatus === "offline"
                      ? "border-[#B3261E] bg-[#B3261E]"
                      : "border-[#B8781F] bg-[#B8781F]"
                }`}
              />
              <span className="truncate text-ink-muted">API {statusMessage}</span>
            </div>
            {apiStatus !== "online" && (
              <button
                type="button"
                onClick={() => void checkApi()}
                disabled={apiStatus === "checking"}
                className="shrink-0 font-medium text-primary hover:underline disabled:opacity-50"
              >
                Retry
              </button>
            )}
          </div>

          {apiStatus === "checking" && wakeAttempt > 0 && (
            <p className="mt-2 text-xs text-[#B8781F]">
              Free-tier Render spins down after idle. First request can take up to 60 seconds.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5"
              />
            </div>
            {error && <p className="text-sm text-[#B3261E]">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            New to ECDAT?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
          <p className="mt-4 font-mono text-[11px] text-ink-muted">Backend: {API_URL}</p>
        </div>
      </div>
    </MarketingLayout>
  );
}
