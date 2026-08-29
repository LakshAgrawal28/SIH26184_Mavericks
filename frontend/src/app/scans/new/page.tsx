"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { API_URL, getToken } from "@/lib/api";

export default function NewScanPage() {
  const router = useRouter();
  const [name, setName] = useState("demo-scan");
  const [file, setFile] = useState<File | null>(null);
  const [dataLifetimeX, setDataLifetimeX] = useState(10);
  const [migrationTimeY, setMigrationTimeY] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("name", name);
    form.append("target_type", "zip_archive");
    form.append("file", file);
    form.append("data_lifetime_x", dataLifetimeX.toString());
    form.append("migration_time_y", migrationTimeY.toString());
    try {
      const res = await fetch(`${API_URL}/api/v1/scans`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { scan_id: string };
      router.push(`/scans/${data.scan_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <Nav title="New Scan">
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
      </Nav>
      <div className="card">
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: 14 }}>
          Upload a <code style={{ color: "#93c5fd" }}>.zip</code> archive from{" "}
          <code style={{ color: "#93c5fd" }}>scanner/corpus/</code> for a quick demo scan.
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="scan-name">Scan name</label>
          <input
            id="scan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label htmlFor="scan-file">Project archive (.zip)</label>
          <input
            id="scan-file"
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />

          <div style={{ marginTop: 15, marginBottom: 15 }}>
            <label htmlFor="scan-x">Data Lifetime (X): <strong>{dataLifetimeX}</strong> years</label>
            <input
              id="scan-x"
              type="range"
              min="1"
              max="30"
              step="1"
              value={dataLifetimeX}
              onChange={(e) => setDataLifetimeX(parseInt(e.target.value))}
              style={{ width: "100%", display: "block", marginTop: 5 }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label htmlFor="scan-y">Migration Time (Y): <strong>{migrationTimeY}</strong> years</label>
            <input
              id="scan-y"
              type="range"
              min="1"
              max="15"
              step="1"
              value={migrationTimeY}
              onChange={(e) => setMigrationTimeY(parseInt(e.target.value))}
              style={{ width: "100%", display: "block", marginTop: 5 }}
            />
          </div>

          <div style={{ padding: 12, background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: "6px", marginBottom: 20, fontSize: 13 }}>
            <strong>Mosca Theorem Baseline Prediction:</strong> Z (CRQC Arrival) = 10.0 years.<br/>
            Your total needed time: X + Y = <strong>{dataLifetimeX + migrationTimeY}</strong> years.<br/>
            {(dataLifetimeX + migrationTimeY) > 10.0 ? (
              <span style={{ color: "var(--danger)", fontWeight: "bold" }}>⚠️ Risk Margin Expired! Data confidentiality will be broken.</span>
            ) : (
              <span style={{ color: "var(--success)", fontWeight: "bold" }}>✅ Secure Margin: {10.0 - (dataLifetimeX + migrationTimeY)} years remaining.</span>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={loading || !file}>
            {loading ? "Uploading…" : "Start Scan"}
          </button>
        </form>
      </div>
    </div>
  );
}
