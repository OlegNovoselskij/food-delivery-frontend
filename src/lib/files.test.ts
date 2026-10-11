import { describe, expect, it } from "vitest";

import { fileTypeLabel, formatBytes } from "./files";

describe("formatBytes", () => {
  it("scales to the largest sensible unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1_258_291)).toBe("1.2 MB");
    expect(formatBytes(3 * 1024 ** 3)).toBe("3.0 GB");
  });

  it("returns an empty string when the size is unknown", () => {
    expect(formatBytes(null)).toBe("");
  });
});

describe("fileTypeLabel", () => {
  it("prefers the content type and falls back to the extension", () => {
    expect(fileTypeLabel("application/pdf", "a.bin")).toBe("PDF");
    expect(fileTypeLabel(null, "notes.docx")).toBe("DOCX");
    expect(fileTypeLabel("application/x-unknown", "Makefile")).toBe("FILE");
  });
});
