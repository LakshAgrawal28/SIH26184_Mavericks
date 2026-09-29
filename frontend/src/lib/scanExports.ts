import { API_URL, getToken } from "@/lib/api";

export async function downloadScanReport(
  scanId: string,
  kind: "cbom" | "pdf"
): Promise<void> {
  const path =
    kind === "cbom"
      ? `/api/v1/scans/${scanId}/reports/cbom`
      : `/api/v1/scans/${scanId}/reports/pdf`;
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
  a.download =
    kind === "cbom" ? `ecdat-cbom-${scanId}.json` : `ecdat-executive-${scanId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
