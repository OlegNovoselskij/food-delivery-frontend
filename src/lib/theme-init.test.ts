import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INLINE_SCRIPT = /<script>([\s\S]*?)<\/script>/;

describe("inline theme script", () => {
  it("is allowed by the content security policy hash", () => {
    const html = readFileSync("index.html", "utf-8");
    const script = INLINE_SCRIPT.exec(html)?.[1];
    const policy = readFileSync("security-headers.inc.template", "utf-8");
    expect(script).toBeDefined();
    const hash = createHash("sha256")
      .update(script ?? "")
      .digest("base64");
    expect(policy).toContain(`'sha256-${hash}'`);
  });
});
