"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { RevealText } from "@/components/landing/primitives";
import { BorderBeamCard } from "@/components/marketing/BorderBeamCard";
import { MagneticButton } from "@/components/marketing/MagneticButton";
import { ShimmerCta } from "@/components/marketing/ShimmerCta";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { API_URL, fetchWithTimeout, waitForApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiStatus = "checking" | "online" | "offline";

const DEMO_ACCOUNT = {
  email: "admin@example.com",
  password: "admin123",
  label: "Demo operator",
};

const HIGHLIGHTS = [
  "Upload zip archives or bundled corpus demos",
  "Evidence-backed artefact inventory",
  "CycloneDX 1.6 export validation",
];

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

  function applyDemoAccount() {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setError("");
  }

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
    <MarketingLayout className="relative">
      <section className="relative min-h-[calc(100vh-60px)] overflow-hidden border-b border-border">
        <div className="intel-grid pointer-events-none absolute inset-0" aria-hidden />
        <HeroNetwork variant="static" className="opacity-50" />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_50%,rgba(5,7,11,0.85),transparent_80%)]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-[1180px] gap-12 px-6 py-12 lg:grid-cols-[1.05fr_420px] lg:items-center lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <Link
              href="/"
              className="ecdat-trust-pill inline-block font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase transition-colors hover:text-primary"
              style={{ animationDelay: "20ms" }}
            >
              ← Back to overview
            </Link>

            <p
              className="ecdat-trust-pill intel-label mt-10"
              style={{ animationDelay: "90ms" }}
            >
              <span className="text-primary">NTRO / ECDAT</span> // SIH 2026 · PS 26164
            </p>

            <h1 className="intel-heading mt-4 text-[2rem] sm:text-[2.35rem]">
              <RevealText text="Operator" immediate delay={0.1} className="block" wordClassName="intel-gradient-text" />
              <RevealText text="console." immediate delay={0.25} className="block" wordClassName="intel-accent-text" />
            </h1>

            <p className="motion-enter motion-enter-delay-3 mt-6 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
              Sign in to run discovery scans, review Mosca timelines, export CBOMs, and use the grounded AI
              assistant — all tied to deterministic scan data.
            </p>

            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map((item, i) => (
                <li
                  key={item}
                  className="ecdat-trust-pill flex items-start gap-3 text-sm text-ink-muted"
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="motion-enter motion-enter-delay-2 lg:justify-self-end">
            <BorderBeamCard innerClassName="bg-[#0a0f17] p-8">
              <h2 className="font-mono text-sm tracking-[0.16em] text-foreground uppercase">Operator sign-in</h2>
              <p className="mt-1 text-sm text-ink-muted">Console access for your deployment</p>

              <div className="mt-4 flex items-center justify-between gap-2 font-mono text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      apiStatus === "online"
                        ? "border-[#1B7A3D] bg-[#1B7A3D]"
                        : apiStatus === "offline"
                          ? "border-[#B3261E] bg-[#B3261E]"
                          : "border-[#B8781F] bg-[#B8781F] animate-pulse"
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

              <div className="mt-5 rounded-lg border border-border bg-white/[0.03] px-4 py-3.5">
                <p className="text-xs font-medium text-foreground">{DEMO_ACCOUNT.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  For local and demo deployments when the default admin is enabled.
                </p>
                <dl className="mt-3 space-y-1.5 font-mono text-[11px] text-ink-muted">
                  <div className="flex justify-between gap-3">
                    <dt>Email</dt>
                    <dd className="text-foreground">{DEMO_ACCOUNT.email}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Password</dt>
                    <dd className="text-foreground">{DEMO_ACCOUNT.password}</dd>
                  </div>
                </dl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={applyDemoAccount}
                  disabled={loading}
                >
                  Fill demo credentials
                </Button>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="ecdat-login-field">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-1.5 transition-shadow duration-300"
                  />
                </div>
                <div className="ecdat-login-field">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    autoComplete="current-password"
                    className="mt-1.5 transition-shadow duration-300"
                  />
                </div>
                {error && <p className="text-sm text-[#fca5a5]">{error}</p>}
                <MagneticButton className="w-full">
                  <ShimmerCta className="w-full">
                    <Button className="w-full" type="submit" disabled={loading}>
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                  </ShimmerCta>
                </MagneticButton>
              </form>

              <p className="mt-5 text-center text-sm text-ink-muted">
                New to ECDAT?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </p>
              <p className="mt-4 font-mono text-[11px] text-ink-muted">Backend: {API_URL}</p>
            </BorderBeamCard>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
