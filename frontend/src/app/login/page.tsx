"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, fetchWithTimeout, waitForApi } from "@/lib/api";
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

            <div className="mt-4 flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    apiStatus === "online"
                      ? "bg-emerald-500"
                      : apiStatus === "offline"
                        ? "bg-red-500"
                        : "animate-pulse bg-amber-400"
                  }`}
                />
                <span className="truncate text-zinc-500">API {statusMessage}</span>
              </div>
              {apiStatus !== "online" && (
                <button
                  type="button"
                  onClick={() => void checkApi()}
                  disabled={apiStatus === "checking"}
                  className="shrink-0 font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  Retry
                </button>
              )}
            </div>

            {apiStatus === "checking" && wakeAttempt > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Free-tier Render spins down after idle. First request can take up to 60 seconds.
              </p>
            )}

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
