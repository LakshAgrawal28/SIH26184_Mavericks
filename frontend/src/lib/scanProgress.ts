/** User-facing labels for backend `current_stage` values. */
export function formatScanStage(stage?: string | null, status?: string): string {
  if (!stage) {
    if (status === "queued") return "Queued — waiting to start";
    if (status === "running") return "Starting scan pipeline…";
    return "Preparing…";
  }
  if (stage === "Upload received") return "Upload complete — starting pipeline";
  if (stage === "Downloading archive") return "Fetching uploaded archive…";
  if (stage === "Extracting files") return "Unpacking project files…";
  if (stage.startsWith("Indexing artefacts")) return stage;
  if (stage.startsWith("Detecting")) return stage;
  if (stage.startsWith("Scoring artefacts")) return stage;
  if (stage.startsWith("Scoring risk")) return "Scoring risk and building recommendations…";
  if (stage === "Failed") return "Scan failed";
  if (stage.startsWith("Completed")) return "Finalizing results…";
  return stage;
}

export function isScanInFlight(status?: string): boolean {
  return status !== undefined && status !== "completed" && status !== "failed";
}

export const SCAN_POLL_INTERVAL_MS = 2500;
