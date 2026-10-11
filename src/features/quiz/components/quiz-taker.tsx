import { useEffect, useState } from "react";

import type { Attempt, QuestionPublic } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { ProgressTrack } from "@/components/domain/progress-track";
import { Button } from "@/components/ui/button";

import {
  buildSubmission,
  countAnswered,
  unansweredCount,
  type DraftAnswer,
  type DraftAnswers,
} from "../answers";
import { loadDraft, saveDraft } from "../draft";
import { useSubmitAttempt } from "../hooks";
import { QuestionCard } from "./question-card";

interface QuizTakerProps {
  attempt: Attempt;
  questions: readonly QuestionPublic[];
  courseId: number | null;
}

export function QuizTaker({ attempt, questions, courseId }: QuizTakerProps) {
  const [answers, setAnswers] = useState<DraftAnswers>(() => loadDraft(attempt.id));
  const submit = useSubmitAttempt(courseId);
  const confirm = useConfirm();
  const locked = submit.isPending || submit.isSuccess;
  const answered = countAnswered(questions, answers);

  useEffect(() => {
    saveDraft(attempt.id, answers);
  }, [attempt.id, answers]);

  function setAnswer(questionId: number, answer: DraftAnswer): void {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  async function handleSubmit(): Promise<void> {
    if (locked) return;
    const missing = unansweredCount(questions, answers);
    if (missing > 0) {
      const confirmed = await confirm({
        title: "Submit with unanswered questions?",
        description: `You left ${missing} ${missing === 1 ? "question" : "questions"} unanswered. They will count as incorrect.`,
        confirmLabel: "Submit quiz",
        cancelLabel: "Keep working",
      });
      if (!confirmed) return;
    }
    submit.mutate({ attempt, answers: buildSubmission(questions, answers) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-[68px] z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-card sm:border sm:bg-surface">
        <div className="flex items-center justify-between gap-4">
          <p className="font-semibold" aria-live="polite">
            {answered} of {questions.length} answered
          </p>
          <p className="text-small text-muted">Pass mark: {attempt.passing_score}%</p>
        </div>
        <ProgressTrack
          segments={[questions.length === 0 ? 0 : answered / questions.length]}
          label="Questions answered"
          className="mt-2"
        />
      </div>

      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          answer={answers[question.id]}
          disabled={locked}
          onChange={(answer) => {
            setAnswer(question.id, answer);
          }}
        />
      ))}

      <div>
        <Button
          size="lg"
          disabled={locked}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {locked ? "Submitting" : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}
