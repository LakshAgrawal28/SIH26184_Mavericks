"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadScanReport } from "@/lib/scanExports";
import { cn } from "@/lib/utils";

type Props = {
  scanId: string;
  cbomValid?: boolean;
  cbomErrorCount?: number;
  className?: string;
};

export default function ScanExportCenter({
  scanId,
  cbomValid,
  cbomErrorCount,
  className,
}: Props) {
  const [cbomLoading, setCbomLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport(kind: "cbom" | "pdf") {
    setError(null);
    if (kind === "cbom") setCbomLoading(true);
    else setPdfLoading(true);
    try {
      await downloadScanReport(scanId, kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setCbomLoading(false);
      setPdfLoading(false);
    }
  }

  return (
    <div className={cn("panel p-6", className)}>
      <h3 className="text-sm font-semibold text-foreground">Export center</h3>
      <p className="mt-1 text-sm text-ink-muted">
        NTRO deliverables: CycloneDX 1.6 CBOM (machine-readable) and executive PDF (leadership
        summary with Mosca context).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={cbomLoading}
          onClick={() => onExport("cbom")}
        >
          {cbomLoading ? "Preparing…" : "Download CycloneDX CBOM"}
        </Button>
        <Button type="button" disabled={pdfLoading} onClick={() => onExport("pdf")}>
          {pdfLoading ? "Generating…" : "Download executive PDF"}
        </Button>
      </div>
      {cbomValid !== undefined && (
        <p
          className={cn(
            "mt-3 text-xs font-medium",
            cbomValid ? "text-[#1B7A3D]" : "text-[#B3261E]"
          )}
        >
          Schema check:{" "}
          {cbomValid
            ? "CycloneDX 1.6 validates against bundled ECMA-424 schema."
            : `Validation failed (${cbomErrorCount ?? "?"} errors) — export may still download for review.`}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-[#B3261E]">{error}</p>}
    </div>
  );
}
