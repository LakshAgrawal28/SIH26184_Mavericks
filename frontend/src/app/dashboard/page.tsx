"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";
import type { Scan } from "@/lib/types";

const SAMPLE_CORPUS = [
  "scanner/corpus/archives/mixed-enterprise.zip",
  "scanner/corpus/archives/java-rsa-aes.zip",
  "scanner/corpus/archives/python-crypto.zip",
  "scanner/corpus/archives/weak-configs.zip",
];

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "running" || s === "processing") return "running";
  if (s === "failed") return "failed";
  return "pending";
}

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<{ headline?: string; recall?: number; invented_algorithms?: number; deterministic?: boolean } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiFetch<{ scans?: Scan[] }>("/api/v1/scans"),
      apiFetch<{ headline?: string; recall?: number; invented_algorithms?: number; deterministic?: boolean }>("/api/v1/accuracy").catch(() => null),
    ])
      .then(([data, acc]) => {
        setScans(data.scans || []);
        if (acc) setAccuracy(acc);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const totalScans = scans.length;
  const totalCritical = scans.reduce((acc, s) => acc + (s.critical_risk_count ?? 0), 0);
  const totalHigh = scans.reduce((acc, s) => acc + (s.high_risk_count ?? 0), 0);
  const totalArtefacts = scans.reduce((acc, s) => acc + (s.total_artefacts ?? 0), 0);

  return (
    <div className="container">
      <Nav title="Dashboard">
        <Button asChild>
          <Link href="/scans/new">New Scan</Link>
        </Button>
      </Nav>

      <div className="grid dash-stats">
        <div className="stat">
          <div className="label">Total scans</div>
          <div className="value">{totalScans}</div>
        </div>
        <div className="stat">
          <div className="label">Total artefacts</div>
          <div className="value">{totalArtefacts}</div>
        </div>
        <div className="stat critical">
          <div className="label">Critical risk</div>
          <div className="value">{totalCritical}</div>
        </div>
        <div className="stat high">
          <div className="label">High risk</div>
          <div className="value">{totalHigh}</div>
        </div>
      </div>

      {accuracy && (
        <div className="card card-highlight">
          <p className="eyebrow">Scoreboard</p>
          <h3>Published corpus accuracy</h3>
          <p className="lede">
            {accuracy.headline || "Deterministic detector scoreboard against labelled fixtures."}
          </p>
          <p>
            Recall <strong>{accuracy.recall ?? "—"}</strong>
            {" · "}
            Invented algorithms <strong>{accuracy.invented_algorithms ?? "—"}</strong>
            {" · "}
            {accuracy.deterministic ? "Deterministic" : "Non-deterministic"}
          </p>
        </div>
      )}

      <div className="card card-highlight">
        <p className="eyebrow">Demonstration</p>
        <h3>Sample corpus</h3>
        <p className="lede">
          Upload one of the bundled test archives from the repo to run a quick demo scan.
          See <code>scanner/corpus/</code> in the project root.
        </p>
        <ul className="corpus-list">
          {SAMPLE_CORPUS.map((path) => (
            <li key={path}>
              <code>{path}</code>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-4">
          <Link href="/scans/new">Upload sample archive</Link>
        </Button>
      </div>

      <div className="card">
        <h3>Recent scans</h3>
        {loading ? (
          <p className="empty-state">Loading scans…</p>
        ) : scans.length === 0 ? (
          <div className="empty-state">
            <p>No scans yet.</p>
            <p>
              <Link href="/scans/new">Upload a project archive</Link> to begin discovery.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Artefacts</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.scan_id}>
                    <td>{s.name}</td>
                    <td>
                      <span className={`status-badge ${statusClass(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>{s.total_artefacts}</td>
                    <td>{s.critical_risk_count}</td>
                    <td>{s.high_risk_count}</td>
                    <td>
                      <Link href={`/scans/${s.scan_id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
