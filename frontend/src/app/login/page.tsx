"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiStatus = "checking" | "online" | "offline";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    async function ping() {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(90000) });
        if (!cancelled) setApiStatus(res.ok ? "online" : "offline");
      } catch {
        if (!cancelled) setApiStatus("offline");
      }
    }
    ping();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(90000),
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
      if (err instanceof TypeError || (err instanceof Error && err.name === "TimeoutError")) {
        setError(
          "Cannot reach the API. The Render backend may be waking up — wait 30–60 seconds and try again."
        );
        setApiStatus("offline");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <section className="hidden flex-1 flex-col justify-between bg-white p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            E
          </div>
          <span className="text-lg font-semibold text-zinc-900">ECDAT</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Cryptographic discovery for the post-quantum era
          </h1>
          <p className="mt-4 text-zinc-500">
            Inventory algorithms, certificates, and TLS posture. Export CycloneDX CBOMs
            and assess harvest-now, decrypt-later risk with Mosca&apos;s theorem.
          </p>
        </div>
        <p className="text-xs text-zinc-400">Enterprise Cryptographic Discovery &amp; Analysis Tool</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
                E
              </div>
              <span className="text-lg font-semibold text-zinc-900">ECDAT</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
            <p className="mt-1 text-sm text-zinc-500">Enter your operator credentials</p>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  apiStatus === "online"
                    ? "bg-emerald-500"
                    : apiStatus === "offline"
                      ? "bg-red-500"
                      : "bg-amber-400"
                }`}
              />
              <span className="text-zinc-500">
                API{" "}
                {apiStatus === "checking"
                  ? "connecting…"
                  : apiStatus === "online"
                    ? "connected"
                    : "unreachable — backend may be waking up"}
              </span>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email" className="text-zinc-700">Email</Label>
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
                <Label htmlFor="password" className="text-zinc-700">Password</Label>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-4 text-center text-[11px] text-zinc-400">
              Backend: {API_URL}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
