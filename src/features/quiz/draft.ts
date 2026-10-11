import { z } from "zod";

import { readStorage, removeStorage, writeStorage } from "@/lib/safe-storage";

import type { DraftAnswers } from "./answers";

const DRAFT_PREFIX = "atrium.quiz-draft.";

const draftSchema = z.record(
  z.string(),
  z.object({ optionIds: z.array(z.number()), text: z.string() }),
);

function draftKey(attemptId: number): string {
  return `${DRAFT_PREFIX}${attemptId}`;
}

export function loadDraft(attemptId: number): DraftAnswers {
  const raw = readStorage(draftKey(attemptId));
  if (raw === null) return {};
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return {};
    return Object.fromEntries(
      Object.entries(parsed.data).map(([id, answer]) => [Number(id), answer]),
    );
  } catch {
    return {};
  }
}

export function saveDraft(attemptId: number, answers: DraftAnswers): void {
  writeStorage(draftKey(attemptId), JSON.stringify(answers));
}

export function clearDraft(attemptId: number): void {
  removeStorage(draftKey(attemptId));
}
