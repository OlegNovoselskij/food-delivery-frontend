import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import type { Attempt } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { courseEnrollmentQuery } from "@/features/enrollment";
import { progressQuery } from "@/features/learning";
import { parseId } from "@/lib/ids";
import { learnPath } from "@/lib/paths";

import { myAttemptsQuery } from "../api";
import { QuizIntro } from "../components/quiz-intro";
import { QuizTaker } from "../components/quiz-taker";
import { useStartAttempt } from "../hooks";
import { quizStatus } from "../status";

const NO_ID = 0;

function useQuizTitle(courseId: number | null, quizId: number): string {
  const enrollment = useQuery(courseEnrollmentQuery(courseId ?? NO_ID, courseId !== null));
  const enrollmentId = enrollment.data?.id ?? NO_ID;
  const progress = useQuery(progressQuery(enrollmentId, enrollmentId !== NO_ID));
  const quiz = progress.data?.modules.find((module) => module.quiz?.id === quizId)?.quiz;
  return quiz?.title ?? "Quiz";
}

function QuizView({ quizId, courseId }: { quizId: number; courseId: number | null }) {
  const attempts = useQuery(myAttemptsQuery(quizId));
  const start = useStartAttempt(quizId);
  const title = useQuizTitle(courseId, quizId);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  const backTo = courseId === null ? "/learning" : learnPath(courseId);

  return (
    <div className="container-page max-w-3xl py-10">
      <title>{`${title} · Atrium`}</title>
      <Link to={backTo} className="text-small font-semibold text-brand-700 hover:underline">
        Back to course
      </Link>
      <h1 className="mt-3 mb-8 text-h1">{title}</h1>

      {attempts.isPending ? (
        <Skeleton role="status" aria-label="Loading quiz" className="h-48 rounded-card" />
      ) : null}
      {attempts.isError ? (
        <ErrorState
          error={attempts.error}
          title="Could not load this quiz"
          onRetry={() => {
            void attempts.refetch();
          }}
        />
      ) : null}

      {attempts.data && attempt?.questions ? (
        <QuizTaker attempt={attempt} questions={attempt.questions} courseId={courseId} />
      ) : null}

      {attempts.data && !attempt?.questions ? (
        <QuizIntro
          attempts={attempts.data}
          status={quizStatus(attempts.data)}
          courseId={courseId}
          starting={start.isPending}
          onStart={() => {
            start.mutate(undefined, { onSuccess: setAttempt });
          }}
        />
      ) : null}
    </div>
  );
}

export function Component() {
  const { quizId } = useParams();
  const [params] = useSearchParams();
  const parsedQuiz = parseId(quizId);
  const courseId = parseId(params.get("course") ?? undefined);

  if (parsedQuiz === null) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={SearchX}
          title="Quiz not found"
          description="The address of this quiz is not valid."
          action={
            <Button asChild>
              <Link to="/learning">Back to my learning</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return <QuizView quizId={parsedQuiz} courseId={courseId} />;
}
