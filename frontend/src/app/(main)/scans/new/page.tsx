"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import FileDropzone from "@/components/FileDropzone";
import MoscaRiskPanel from "@/components/MoscaRiskPanel";
import { IconLockScan } from "@/components/icons/NavIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { API_URL, getToken } from "@/lib/api";
import { fetchCorpusDemo, findCorpusDemo } from "@/lib/corpus";

function NewScanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoFile = searchParams.get("demo");

  const [name, setName] = useState("demo-scan");
  const [file, setFile] = useState<File | null>(null);
  const [dataLifetimeX, setDataLifetimeX] = useState(10);
  const [migrationTimeY, setMigrationTimeY] = useState(4);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!demoFile) return;

    const entry = findCorpusDemo(demoFile);
    if (!entry) {
      setError(`Unknown demo archive: ${demoFile}`);
      return;
    }

    setName(entry.scanName);
    setDemoLoading(true);
    setError("");

    fetchCorpusDemo(demoFile)
      .then((demo) => setFile(demo))
      .catch((err) => {
        setFile(null);
        setError(err instanceof Error ? err.message : `Failed to load ${demoFile}`);
      })
      .finally(() => setDemoLoading(false));
  }, [demoFile]);

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

  const demoEntry = demoFile ? findCorpusDemo(demoFile) : undefined;

  return (
    <>
      <PageHeader
        title="New scan"
        description="Upload a project archive to discover cryptographic assets and assess quantum risk."
        breadcrumb={["ECDAT", "Scans", "New"]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={onSubmit} className="panel p-6">
          <div className="space-y-5">
            {demoEntry && (
              <div className="border border-[#1B4B8C] bg-surface px-4 py-3 text-sm text-foreground">
                <p className="font-medium">Quick start demo</p>
                <p className="mt-0.5 text-ink-muted">{demoEntry.description}</p>
              </div>
            )}

            <div>
              <Label htmlFor="scan-name">Scan name</Label>
              <Input
                id="scan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Project archive</Label>
              <div className="mt-1.5">
                {demoLoading ? (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface px-6 py-10">
                    <p className="font-mono text-sm text-ink-muted">Loading {demoFile}…</p>
                  </div>
                ) : (
                  <FileDropzone file={file} onFileChange={setFile} />
                )}
              </div>
            </div>

            <div className="panel-muted p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scan-x">Data lifetime (X)</Label>
                <span className="font-mono text-xs text-[#1B4B8C]">
                  {dataLifetimeX} years
                </span>
              </div>
              <Slider
                id="scan-x"
                className="mt-3"
                min={1}
                max={30}
                step={1}
                value={[dataLifetimeX]}
                onValueChange={(v) => setDataLifetimeX(v[0] ?? 10)}
              />
            </div>

            <div className="panel-muted p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scan-y">Migration time (Y)</Label>
                <span className="font-mono text-xs text-[#1B4B8C]">
                  {migrationTimeY} years
                </span>
              </div>
              <Slider
                id="scan-y"
                className="mt-3"
                min={1}
                max={15}
                step={1}
                value={[migrationTimeY]}
                onValueChange={(v) => setMigrationTimeY(v[0] ?? 4)}
              />
            </div>

            {error && <p className="text-sm text-[#B3261E]">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || demoLoading || !file}>
              <IconLockScan />
              {loading ? "Starting…" : "Start scan"}
            </Button>
          </div>
        </form>

        <MoscaRiskPanel
          dataLifetimeX={dataLifetimeX}
          migrationTimeY={migrationTimeY}
        />
      </div>
    </>
  );
}

export default function NewScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <NewScanForm />
    </Suspense>
  );
}
