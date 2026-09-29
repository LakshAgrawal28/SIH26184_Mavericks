"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import CipherScramble from "@/components/CipherScramble";
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
    <MarketingLayout>
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-12 lg:grid-cols-[1fr_400px] lg:items-start lg:py-16">
        <div className="motion-enter max-w-lg">
          <Link href="/" className="text-xs text-ink-muted transition-colors hover:text-primary">
            ← Back to overview
          </Link>
          <CipherScramble className="mt-8 font-mono text-base text-foreground md:text-lg" />
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Create an operator account to run discovery scans, review evidence, and build a cryptographic migration plan.
          </p>
        </div>
        <div className="panel-elevated motion-enter motion-enter-delay-1 p-8">
          <h2 className="text-lg font-semibold text-foreground">Create operator account</h2>
          <p className="mt-1 text-sm text-ink-muted">New accounts start with standard operator access.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} autoComplete="new-password" className="mt-1.5" />
              <p className="mt-1 text-xs text-ink-muted">At least 8 characters.</p>
            </div>
            {error && <p className="text-sm text-[#fca5a5]">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
