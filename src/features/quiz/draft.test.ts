import { describe, expect, it } from "vitest";

import { clearDraft, loadDraft, saveDraft } from "./draft";

describe("quiz draft storage", () => {
  it("restores saved answers with numeric question ids", () => {
    saveDraft(7, { 1: { optionIds: [10], text: "" }, 2: { optionIds: [], text: "Because" } });
    expect(loadDraft(7)).toEqual({
      1: { optionIds: [10], text: "" },
      2: { optionIds: [], text: "Because" },
    });
  });

  it("keeps drafts of different attempts apart and can clear one", () => {
    saveDraft(1, { 1: { optionIds: [1], text: "" } });
    saveDraft(2, { 1: { optionIds: [2], text: "" } });
    clearDraft(1);
    expect(loadDraft(1)).toEqual({});
    expect(loadDraft(2)[1]?.optionIds).toEqual([2]);
  });

  it("ignores broken data", () => {
    window.localStorage.setItem("atrium.quiz-draft.9", "{not json");
    expect(loadDraft(9)).toEqual({});
    window.localStorage.setItem("atrium.quiz-draft.9", JSON.stringify({ 1: { optionIds: "x" } }));
    expect(loadDraft(9)).toEqual({});
  });
});
