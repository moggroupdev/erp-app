import type { ApiRequestOptions, Dictionary } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function apiRequest<T>({
  url,
  method = "GET",
  headers = {},
  params = {},
  data = null,
  credentials = "same-origin",
  signal,
  download,
  filename,
}: ApiRequestOptions): Promise<T> {
  try {
    // Serialize and append params to URL if any
    if (Object.keys(params).length) {
      const queryString = serializeParams(params);
      url += `?${queryString}`;
    }

    // Prepare body and headers
    let body: ApiRequestOptions["data"] = null;
    let finalHeaders = headers;

    if (data)
      if (data instanceof FormData) body = data;
      else {
        body = JSON.stringify(data);
        finalHeaders = { ...headers, "Content-Type": "application/json" };
      }

    // Prepare final options
    const finalOptions = { method, headers: finalHeaders, body, credentials, signal };

    // Send the request
    const response = await fetch(`${API_BASE_URL}/${url}`, finalOptions);

    // Throw an error if the response isn't ok
    if (!response.ok) throw await response.json();

    // If it's a download request, download the file and return null
    if (download) {
      const contentDisposition = response.headers.get("Content-Disposition");
      const serverFilename = contentDisposition ? contentDisposition.split("filename=")[1]?.replace(/["']/g, "") : undefined;
      const finalFilename = filename || serverFilename || "download";
      const blob = await response.blob();
      downloadBlob(blob, finalFilename);
      return null as T;
    }

    // If the response is 204 (No Content), return null
    if (response.status === 204) return null as T;

    // If it's ok, return the response as an object
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") throw new Error("عذرًا! حدث خطأ أثناء الاتصال.");
    throw error;
  }
}

// =============================================================

function serializeParams(params: Dictionary): string {
  const filteredEntries = Object.entries(params).filter(([, value]) => value !== null && value !== undefined);
  return new URLSearchParams(filteredEntries.map(([key, value]) => [key, String(value)])).toString();
}

// =============================================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
