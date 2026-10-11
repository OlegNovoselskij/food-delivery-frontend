import { formatBytes } from "./files";

export interface FileRules {
  types: readonly string[];
  maxBytes: number;
  hint: string;
}

const MEGABYTE = 1024 ** 2;
const GIGABYTE = 1024 ** 3;

export const VIDEO_RULES: FileRules = {
  types: ["video/mp4", "video/webm"],
  maxBytes: 2 * GIGABYTE,
  hint: "MP4 or WebM, up to 2 GB",
};

export const MATERIAL_RULES: FileRules = {
  types: [
    "application/pdf",
    "application/zip",
    "text/plain",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxBytes: 100 * MEGABYTE,
  hint: "PDF, ZIP, TXT, PNG, JPG, DOCX, PPTX or XLSX, up to 100 MB",
};

const EXTENSION_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  zip: "application/zip",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

interface FileLike {
  name: string;
  size: number;
  type: string;
}

export function contentTypeOf(file: FileLike): string {
  if (file.type !== "") return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? "";
}

export function validateFile(file: FileLike, rules: FileRules): string | null {
  if (file.size <= 0) return "This file is empty. Choose another file.";
  if (!rules.types.includes(contentTypeOf(file))) {
    return `This file type is not supported. Use ${rules.hint}.`;
  }
  if (file.size > rules.maxBytes) {
    return `This file is ${formatBytes(file.size)}, which is over the limit. Use ${rules.hint}.`;
  }
  return null;
}

export function titleFromFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return base.replace(/[_-]+/g, " ").trim() || name;
}
