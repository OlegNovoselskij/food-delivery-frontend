import { describe, expect, it } from "vitest";

import {
  MATERIAL_RULES,
  VIDEO_RULES,
  contentTypeOf,
  titleFromFilename,
  validateFile,
} from "./file-rules";

describe("validateFile", () => {
  it("accepts allowed videos within the size limit", () => {
    expect(validateFile({ name: "a.mp4", size: 1000, type: "video/mp4" }, VIDEO_RULES)).toBeNull();
    expect(
      validateFile({ name: "a.webm", size: 1000, type: "video/webm" }, VIDEO_RULES),
    ).toBeNull();
  });

  it("rejects other types with a hint about what is allowed", () => {
    expect(validateFile({ name: "a.mov", size: 1000, type: "video/quicktime" }, VIDEO_RULES)).toBe(
      "This file type is not supported. Use MP4 or WebM, up to 2 GB.",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateFile({ name: "a.mp4", size: 0, type: "video/mp4" }, VIDEO_RULES)).toMatch(
      /empty/,
    );
    const huge = 101 * 1024 ** 2;
    expect(
      validateFile({ name: "a.pdf", size: huge, type: "application/pdf" }, MATERIAL_RULES),
    ).toMatch(/101\.0 MB, which is over the limit/);
  });

  it("falls back to the extension when the browser gives no type", () => {
    expect(contentTypeOf({ name: "Notes.PDF", size: 1, type: "" })).toBe("application/pdf");
    expect(validateFile({ name: "notes.pdf", size: 10, type: "" }, MATERIAL_RULES)).toBeNull();
    expect(contentTypeOf({ name: "mystery", size: 1, type: "" })).toBe("");
  });
});

describe("titleFromFilename", () => {
  it("makes a readable title", () => {
    expect(titleFromFilename("generics-cheatsheet.pdf")).toBe("generics cheatsheet");
    expect(titleFromFilename("Week_1_notes.docx")).toBe("Week 1 notes");
    expect(titleFromFilename(".hidden")).toBe(".hidden");
  });
});
