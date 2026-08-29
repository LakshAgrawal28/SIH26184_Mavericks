"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { apiFetch, getToken } from "@/lib/api";
import type { Scan } from "@/lib/types";

const SAMPLE_CORPUS = [
  "scanner/corpus/java-rsa-aes.zip",
  "scanner/corpus/python-crypto.zip",
  "scanner/corpus/nodejs-jwt.zip",
  "scanner/corpus/weak-configs.zip",
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

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<{ scans?: Scan[] }>("/api/v1/scans")
      .then((data) => setScans(data.scans || []))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="container">
      <Nav title="Dashboard">
        <Link href="/scans/new" className="btn">New Scan</Link>
      </Nav>

      <div className="card card-highlight">
        <h3>Sample Corpus for Demo</h3>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>
          Upload one of the bundled test archives from the repo to run a quick demo scan.
          See <code style={{ color: "#93c5fd" }}>scanner/corpus/</code> in the project root.
        </p>
        <ul className="corpus-list">
          {SAMPLE_CORPUS.map((path) => (
            <li key={path}>
              <code>{path}</code>
            </li>
          ))}
        </ul>
        <Link href="/scans/new" className="btn" style={{ marginTop: 16 }}>
          Upload Sample Archive
        </Link>
      </div>

      <div className="card">
        <h3>Recent Scans</h3>
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
                      <Link href={`/scans/${s.scan_id}`}>Open →</Link>
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
