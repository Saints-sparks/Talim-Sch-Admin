/**
 * File downloads from the API: fetch a non-JSON body (a workbook, a CSV) with
 * the signed-in session, then hand it to the browser as a saved file.
 *
 * `apiClient.request` attaches the token, refreshes it once on a 401 and turns
 * connectivity failures into `ApiError`s; a non-2xx body is read as the usual
 * error envelope so the caller sees the same `ApiError` a JSON call would throw.
 */
import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

/** A downloaded body and the name the server suggested for it. */
export interface DownloadedFile {
  blob: Blob;
  /** From `Content-Disposition`, else the fallback the caller gave. */
  fileName: string;
}

/**
 * The file name in a `Content-Disposition` header (`filename*=` first, then
 * `filename=`), or `null` when there is none.
 *
 * @param header - The header's value.
 * @returns The name.
 */
export function fileNameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* fall through to the plain name */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * Fetches a file from the API.
 *
 * @param url - Path relative to the API base.
 * @param fallbackName - The name to use when the server sends none.
 * @param timeoutMs - Client timeout; default 60 s.
 * @returns The body and its name.
 * @throws `ApiError` for any non-2xx answer or a network failure.
 */
export async function fetchFile(
  url: string,
  fallbackName: string,
  timeoutMs = 60_000
): Promise<DownloadedFile> {
  const response = await apiClient.request(url, { method: "GET", timeoutMs });
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw ApiError.fromResponse(response, body as Parameters<typeof ApiError.fromResponse>[1]);
  }
  const blob = await response.blob();
  return {
    blob,
    fileName: fileNameFromDisposition(response.headers.get("content-disposition")) ?? fallbackName,
  };
}

/**
 * Saves a blob through a temporary link (the browser's download).
 *
 * @param blob - The content.
 * @param fileName - The name to save it under.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after the click has been handled, or some browsers cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
