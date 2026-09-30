import { API_URL, getToken } from "@/lib/api";

export type ScanCreateResult = {
  scan_id: string;
  status?: string;
};

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export function uploadScan(
  form: FormData,
  onUploadProgress?: (percent: number) => void
): Promise<ScanCreateResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/v1/scans`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (!onUploadProgress || !event.lengthComputable) return;
      onUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ScanCreateResult);
        } catch {
          reject(new Error("Invalid response from server"));
        }
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.ontimeout = () =>
      reject(new Error("Upload timed out — try a smaller archive or check your connection"));

    xhr.send(form);
  });
}
