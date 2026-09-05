"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed — check credentials and API connection");
      const data = (await res.json()) as { access_token: string };
      localStorage.setItem("ecdat_token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split">
      <section className="login-panel">
        <p className="eyebrow">Enterprise cryptographic discovery</p>
        <h1>Inventory the estate. Brief the risk.</h1>
        <p>
          ECDAT maps algorithms, certificates, TLS posture, and binaries into a
          CycloneDX CBOM — then scores harvest-now, decrypt-later exposure against Mosca&apos;s theorem.
        </p>
        <dl className="login-meta">
          <div>
            <dt>Classification</dt>
            <dd>Internal briefing copy</dd>
          </div>
          <div>
            <dt>Default operator</dt>
            <dd>admin@example.com</dd>
          </div>
        </dl>
      </section>
      <section className="login-form-col">
        <div className="card" style={{ width: "100%", maxWidth: 380, margin: 0, border: "none", padding: 0, background: "transparent" }}>
          <p className="eyebrow">Sign in</p>
          <h2>Operator access</h2>
          <form onSubmit={onSubmit}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mb-4"
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              className="mb-4"
            />
            {error && <p className="error-text">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
