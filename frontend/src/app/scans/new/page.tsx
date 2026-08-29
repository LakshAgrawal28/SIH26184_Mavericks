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
    form.append("data_lifetime_x", "10");
    form.append("migration_time_y", "4");
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
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={loading || !file}>
            {loading ? "Uploading…" : "Start Scan"}
          </button>
        </form>
      </div>
    </div>
  );
}
