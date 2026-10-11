import { CircleCheck, Clock } from "lucide-react";
import { Link } from "react-router";

import type { AttemptSummary } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { attemptPath } from "@/lib/paths";

import { attemptLabel, bestScore, type QuizStatus } from "../status";

interface QuizIntroProps {
  attempts: readonly AttemptSummary[];
  status: QuizStatus;
  courseId: number | null;
  starting: boolean;
  onStart: () => void;
}

const START_LABELS: Record<QuizStatus, string> = {
  ready: "Start quiz",
  "in-progress": "Continue quiz",
  "awaiting-review": "Start quiz",
  passed: "Start quiz",
};

export function QuizIntro({ attempts, status, courseId, starting, onStart }: QuizIntroProps) {
  const best = bestScore(attempts);
  const label = attempts.length > 0 && status === "ready" ? "Try again" : START_LABELS[status];

  return (
    <div className="flex flex-col gap-8">
      {status === "passed" ? (
        <div className="flex items-start gap-3 rounded-card border border-success-600 bg-success-50 p-5 text-success-ink">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            You passed this quiz{best === null ? "" : ` with ${best}%`}. You do not need to take it
            again.
          </p>
        </div>
      ) : null}
      {status === "awaiting-review" ? (
        <div className="flex items-start gap-3 rounded-card border border-warning-600 bg-warning-50 p-5 text-warning-ink">
          <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>
            Your last attempt includes written answers that your teacher still has to grade. You can
            take the quiz again after the review.
          </p>
        </div>
      ) : null}

      {status === "ready" || status === "in-progress" ? (
        <div>
          <Button size="lg" disabled={starting} onClick={onStart}>
            {starting ? "Starting" : label}
          </Button>
          <p className="mt-3 text-small text-muted">
            {status === "in-progress"
              ? "Your answers are saved on this device while you work."
              : "You will see all questions on one page and can submit when you are ready."}
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-h3 font-semibold">Your attempts</h2>
        {attempts.length === 0 ? (
          <p className="text-muted">You have not taken this quiz yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {attempts.map((attempt, index) => (
              <li key={attempt.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="font-semibold">Attempt {attempts.length - index}</span>
                <Badge
                  tone={
                    attempt.passed === true
                      ? "success"
                      : attempt.status === "graded"
                        ? "danger"
                        : "warning"
                  }
                >
                  {attemptLabel(attempt)}
                </Badge>
                {attempt.score !== null ? (
                  <span className="text-ink-soft">{attempt.score}%</span>
                ) : null}
                <time dateTime={attempt.started_at} className="ml-auto text-small text-muted">
                  {formatDate(attempt.started_at)}
                </time>
                {attempt.status !== "in_progress" ? (
                  <Link
                    to={attemptPath(attempt.id, courseId)}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    View result
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
