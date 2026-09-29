"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { BorderBeamCard } from "@/components/marketing/BorderBeamCard";
import { MarketingLayout } from "@/components/marketing/SiteChrome";
import { API_URL, fetchWithTimeout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        if (response.status === 409) throw new Error("An account with this email already exists.");
        if (response.status === 422) throw new Error("Use a valid name, email, and password of at least 8 characters.");
        throw new Error(`API error (${response.status}). Try again in a moment.`);
      }
      const data = (await response.json()) as { access_token: string };
      localStorage.setItem("ecdat_token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          <div className="motion-enter max-w-xl">
            <Link
              href="/"
              className="ecdat-trust-pill inline-block font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase transition-colors hover:text-primary"
            >
              ← Back to overview
            </Link>
            <p className="ecdat-trust-pill intel-label mt-8">
              <span className="text-primary">NTRO / ECDAT</span> // operator onboarding
            </p>
            <CipherScramble className="intel-heading mt-3 block text-[1.75rem] leading-[1.05] text-foreground sm:text-[2rem]" />
            <p className="mt-5 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
              Create an operator account to run discovery scans, review evidence, and build a cryptographic
              migration plan.
            </p>
          </div>

          <div className="motion-enter motion-enter-delay-1 lg:justify-self-end">
            <BorderBeamCard innerClassName="intel-glass p-8">
              <h2 className="intel-heading text-[1.35rem] text-foreground">Create operator account</h2>
              <p className="mt-1 text-sm text-ink-muted">New accounts start with standard operator access.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="ecdat-login-field">
                  <Label htmlFor="name" className="text-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                    className="mt-1.5 border-border/90 bg-surface shadow-none"
                  />
                </div>
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
                    className="mt-1.5 border-border/90 bg-surface shadow-none"
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
                    minLength={8}
                    autoComplete="new-password"
                    className="mt-1.5 border-border/90 bg-surface shadow-none"
                  />
                  <p className="mt-1 text-xs text-ink-muted">At least 8 characters.</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" type="submit" size="lg" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-ink-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </BorderBeamCard>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
