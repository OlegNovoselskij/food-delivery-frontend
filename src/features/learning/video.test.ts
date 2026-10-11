import { describe, expect, it } from "vitest";

import { clampSeek, isInteractiveTarget, shortcutFor, shouldApplyVideoUrl } from "./video";

describe("shortcutFor", () => {
  it("maps the documented keys", () => {
    expect(shortcutFor(" ")).toBe("toggle-play");
    expect(shortcutFor("ArrowLeft")).toBe("seek-back");
    expect(shortcutFor("ArrowRight")).toBe("seek-forward");
    expect(shortcutFor("m")).toBe("toggle-mute");
    expect(shortcutFor("M")).toBe("toggle-mute");
  });

  it("ignores other keys", () => {
    expect(shortcutFor("k")).toBeNull();
    expect(shortcutFor("Enter")).toBeNull();
  });
});

describe("isInteractiveTarget", () => {
  it("is true for form controls, links, buttons and the video itself", () => {
    for (const tag of ["input", "textarea", "select", "button", "a", "video"]) {
      expect(isInteractiveTarget(document.createElement(tag))).toBe(true);
    }
  });

  it("is true for widgets with an interactive role", () => {
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    expect(isInteractiveTarget(tab)).toBe(true);
  });

  it("is false for plain containers and the body", () => {
    expect(isInteractiveTarget(document.createElement("div"))).toBe(false);
    expect(isInteractiveTarget(document.body)).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
  });
});

describe("shouldApplyVideoUrl", () => {
  it("always applies the first url", () => {
    expect(shouldApplyVideoUrl(null, "a", true)).toBe(true);
  });

  it("swaps a refreshed url only while the video is not playing", () => {
    expect(shouldApplyVideoUrl("a", "b", true)).toBe(false);
    expect(shouldApplyVideoUrl("a", "b", false)).toBe(true);
    expect(shouldApplyVideoUrl("a", "a", false)).toBe(false);
  });
});

describe("clampSeek", () => {
  it("stays inside the video", () => {
    expect(clampSeek(3, -5, 100)).toBe(0);
    expect(clampSeek(98, 5, 100)).toBe(100);
    expect(clampSeek(10, 5, 100)).toBe(15);
  });

  it("handles an unknown duration", () => {
    expect(clampSeek(10, 5, Number.NaN)).toBe(15);
    expect(clampSeek(2, -5, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
