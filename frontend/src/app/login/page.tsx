"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { RevealText } from "@/components/landing/primitives";
import { BorderBeamCard } from "@/components/marketing/BorderBeamCard";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { API_URL, fetchWithTimeout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      } else if (err instanceof TypeError) {
        setError("Cannot reach the API. Wait 30–60 seconds if the server was idle, then try again.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingLayout className="relative">
      <section className="relative min-h-[calc(100vh-60px)] overflow-hidden border-b border-border">
        <div className="intel-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_42%_48%,rgba(13,59,102,0.06),transparent_72%)]"
          aria-hidden
        />
        <HeroNetwork variant="static" className="opacity-70" />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_55%_50%,rgba(251,251,250,0.72),transparent_80%)]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-[1180px] gap-10 px-6 py-12 lg:grid-cols-[1.05fr_420px] lg:items-center lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <Link
              href="/"
              className="ecdat-trust-pill inline-block font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase transition-colors hover:text-primary"
              style={{ animationDelay: "20ms" }}
            >
              ← Back to overview
            </Link>

            <p
              className="ecdat-trust-pill intel-label mt-8"
              style={{ animationDelay: "90ms" }}
            >
              <span className="text-primary">NTRO / ECDAT</span> // SIH 2026 · PS 26164
            </p>

            <h1 className="intel-heading mt-3 text-[2rem] sm:text-[2.35rem]">
              <RevealText text="Operator" immediate delay={0.1} className="block" wordClassName="intel-gradient-text" />
              <RevealText text="console." immediate delay={0.25} className="block" wordClassName="intel-accent-text" />
            </h1>

            <p className="motion-enter motion-enter-delay-3 mt-5 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
              Sign in to run discovery scans, review Mosca timelines, export CBOMs, and use the grounded AI
              assistant — all tied to deterministic scan data.
            </p>

            <ul className="mt-7 space-y-2.5">
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
            <BorderBeamCard innerClassName="intel-glass p-8">
              <h2 className="intel-heading text-[1.35rem] text-foreground">Operator sign-in</h2>
              <p className="mt-1 text-sm text-ink-muted">Console access for your deployment</p>

              <div className="panel-muted mt-5 px-4 py-3.5">
                <p className="text-xs font-medium text-foreground">{DEMO_ACCOUNT.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  For local and demo deployments when the default admin is enabled.
                </p>
                <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Email</dt>
                    <dd className="text-foreground">{DEMO_ACCOUNT.email}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Password</dt>
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
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-1.5 border-border/90 bg-surface shadow-none transition-shadow duration-300"
                  />
                </div>
                <div className="ecdat-login-field">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    autoComplete="current-password"
                    className="mt-1.5 border-border/90 bg-surface shadow-none transition-shadow duration-300"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" type="submit" size="lg" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
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
