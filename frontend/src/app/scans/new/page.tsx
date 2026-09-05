"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

  const needed = dataLifetimeX + migrationTimeY;
  const expired = needed > 10;

  return (
    <div className="container">
      <Nav title="New Scan">
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
      </Nav>
      <div className="card">
        <p className="lede">
          Upload a <code>.zip</code> archive. For the SIH demo use{" "}
          <code>scanner/corpus/archives/mixed-enterprise.zip</code>
          {" "}(Java RSA + nginx TLS 1.0 + expiring cert + <code>.so</code>).
        </p>
        <form onSubmit={onSubmit}>
          <Label htmlFor="scan-name">Scan name</Label>
          <Input
            id="scan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mb-4"
          />
          <Label htmlFor="scan-file">Project archive (.zip)</Label>
          <Input
            id="scan-file"
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="mb-4 h-auto py-2"
          />

          <div className="mosca-field mb-4">
            <Label htmlFor="scan-x">
              <span>Data lifetime (X)</span>
              <strong>{dataLifetimeX} years</strong>
            </Label>
            <Slider
              id="scan-x"
              min={1}
              max={30}
              step={1}
              value={[dataLifetimeX]}
              onValueChange={(v) => setDataLifetimeX(v[0] ?? 10)}
            />
          </div>

          <div className="mosca-field mb-4">
            <Label htmlFor="scan-y">
              <span>Migration time (Y)</span>
              <strong>{migrationTimeY} years</strong>
            </Label>
            <Slider
              id="scan-y"
              min={1}
              max={15}
              step={1}
              value={[migrationTimeY]}
              onValueChange={(v) => setMigrationTimeY(v[0] ?? 4)}
            />
          </div>

          <div className={`callout ${expired ? "warn" : "ok"}`}>
            <strong>Mosca baseline.</strong> Z (CRQC arrival) = 10.0 years.
            Needed time X + Y = <strong>{needed}</strong> years.{" "}
            {expired ? (
              <span className="action-hot">Risk margin expired: data confidentiality will be broken.</span>
            ) : (
              <span>Secure margin: {10 - needed} years remaining.</span>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}
          <Button type="submit" disabled={loading || !file}>
            {loading ? "Uploading…" : "Start scan"}
          </Button>
        </form>
      </div>
    </div>
  );
}
