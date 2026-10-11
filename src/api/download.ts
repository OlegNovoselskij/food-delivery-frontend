const FILENAME_PATTERN = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (header === null) return fallback;
  const match = FILENAME_PATTERN.exec(header);
  const raw = match?.[1];
  if (raw === undefined) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
