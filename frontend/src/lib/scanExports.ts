import { API_URL, getToken } from "@/lib/api";

const REPORT_PATHS: Record<"cbom" | "pdf" | "sarif", string> = {
  cbom: "/reports/cbom",
  pdf: "/reports/pdf",
  sarif: "/reports/sarif",
};

const REPORT_FILENAMES: Record<"cbom" | "pdf" | "sarif", (id: string) => string> = {
  cbom: (id) => `ecdat-cbom-${id}.json`,
  pdf: (id) => `ecdat-executive-${id}.pdf`,
  sarif: (id) => `ecdat-sarif-${id}.sarif.json`,
};

export async function downloadScanReport(
  scanId: string,
  kind: "cbom" | "pdf" | "sarif"
): Promise<void> {
  const path = `/api/v1/scans/${scanId}${REPORT_PATHS[kind]}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = REPORT_FILENAMES[kind](scanId);
  a.click();
  URL.revokeObjectURL(url);
}
