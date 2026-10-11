import { describe, expect, it } from "vitest";

import { filenameFromDisposition } from "./download";

describe("filenameFromDisposition", () => {
  it("reads a quoted filename", () => {
    expect(filenameFromDisposition('attachment; filename="certificate-42.pdf"', "x.pdf")).toBe(
      "certificate-42.pdf",
    );
  });

  it("reads an unquoted and an encoded filename", () => {
    expect(filenameFromDisposition("attachment; filename=report.csv", "x.csv")).toBe("report.csv");
    expect(filenameFromDisposition("attachment; filename*=UTF-8''my%20report.csv", "x.csv")).toBe(
      "my report.csv",
    );
  });

  it("falls back when the header is missing or has no filename", () => {
    expect(filenameFromDisposition(null, "fallback.pdf")).toBe("fallback.pdf");
    expect(filenameFromDisposition("attachment", "fallback.pdf")).toBe("fallback.pdf");
  });
});
