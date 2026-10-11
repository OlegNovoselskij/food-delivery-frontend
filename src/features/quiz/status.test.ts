import { describe, expect, it } from "vitest";

import type { AttemptSummary } from "@/api/types";

import { attemptLabel, bestScore, quizStatus } from "./status";

function attempt(overrides: Partial<AttemptSummary>): AttemptSummary {
  return {
    id: 1,
    status: "graded",
    score: 40,
    passed: false,
    points_earned: 4,
    points_total: 10,
    started_at: "2026-03-01T10:00:00Z",
    submitted_at: "2026-03-01T10:05:00Z",
    ...overrides,
  };
}

describe("quizStatus", () => {
  it("is ready with no attempts or only failed ones", () => {
    expect(quizStatus([])).toBe("ready");
    expect(quizStatus([attempt({})])).toBe("ready");
  });

  it("is passed as soon as one attempt passed", () => {
    expect(quizStatus([attempt({}), attempt({ id: 2, passed: true, score: 90 })])).toBe("passed");
  });

  it("waits for review and continues open attempts", () => {
    expect(quizStatus([attempt({ status: "pending_review", passed: null, score: null })])).toBe(
      "awaiting-review",
    );
    expect(quizStatus([attempt({ status: "in_progress", passed: null, score: null })])).toBe(
      "in-progress",
    );
  });
});

describe("bestScore", () => {
  it("returns the highest score or null", () => {
    expect(bestScore([attempt({ score: 40 }), attempt({ id: 2, score: 70 })])).toBe(70);
    expect(bestScore([attempt({ score: null })])).toBeNull();
    expect(bestScore([])).toBeNull();
  });
});

describe("attemptLabel", () => {
  it("describes each state", () => {
    expect(attemptLabel(attempt({ status: "in_progress" }))).toBe("In progress");
    expect(attemptLabel(attempt({ status: "pending_review" }))).toBe("Waiting for review");
    expect(attemptLabel(attempt({ passed: true }))).toBe("Passed");
    expect(attemptLabel(attempt({ passed: false }))).toBe("Not passed");
  });
});
