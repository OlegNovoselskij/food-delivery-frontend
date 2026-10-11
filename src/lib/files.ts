const BYTES_PER_UNIT = 1024;
const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes < 0) return "";
  let value = bytes;
  let unit = 0;
  while (value >= BYTES_PER_UNIT && unit < UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unit += 1;
  }
  const rounded = unit === 0 ? String(value) : value.toFixed(1);
  return `${rounded} ${UNITS[unit]}`;
}

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

export function fileTypeLabel(contentType: string | null, filename: string): string {
  if (contentType !== null) {
    const label = TYPE_LABELS[contentType.split(";")[0]?.trim() ?? ""];
    if (label) return label;
  }
  const extension = filename.includes(".") ? filename.split(".").pop() : undefined;
  return extension ? extension.toUpperCase() : "FILE";
}
