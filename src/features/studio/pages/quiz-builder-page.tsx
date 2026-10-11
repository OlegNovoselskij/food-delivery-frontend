import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info, SearchX, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router";

import { toApiError } from "@/api/errors";
import type { QuizManage } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseId } from "@/lib/ids";

import { quizManageQuery } from "../quiz/api";
import { QuestionList } from "../quiz/components/question-list";
import { QuizSettingsForm } from "../quiz/components/quiz-settings-form";
import { useDeleteQuiz } from "../quiz/hooks";
import { questionsSummary } from "../quiz/quiz-model";

const HTTP_NOT_FOUND = 404;

function QuizSkeleton() {
  return (
    <div role="status" aria-label="Loading quiz" className="container-page py-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-4 h-9 w-2/3 max-w-xl" />
      <Skeleton className="mt-8 h-48 rounded-card" />
      <Skeleton className="mt-5 h-40 rounded-card" />
    </div>
  );
}

function NotFound({ courseId }: { courseId: number | null }) {
  return (
    <div className="container-page py-10">
      <EmptyState
        icon={SearchX}
        title="Quiz not found"
        description="This quiz does not exist or belongs to another teacher."
        action={
          <Button asChild>
            <Link to={courseId === null ? "/studio" : `/studio/courses/${courseId}`}>
              Back to the course
            </Link>
          </Button>
        }
      />
    </div>
  );
}

function QuizHeader({ courseId, quiz }: { courseId: number; quiz: QuizManage }) {
  const deletion = useDeleteQuiz(courseId, quiz);
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <Button asChild variant="link">
          <Link to={`/studio/courses/${courseId}`}>
            <ArrowLeft aria-hidden="true" />
            Back to the course
          </Link>
        </Button>
        <h1 className="mt-3 text-h1">{quiz.title}</h1>
        <p className="mt-1 text-muted">{questionsSummary(quiz)}</p>
      </div>
      <Button
        variant="secondary"
        disabled={quiz.has_attempts || deletion.isPending}
        onClick={() => {
          void deletion.remove();
        }}
      >
        <Trash2 aria-hidden="true" />
        Delete quiz
      </Button>
    </header>
  );
}

function QuizView({ courseId, quizId }: { courseId: number; quizId: number }) {
  const quiz = useQuery(quizManageQuery(quizId));

  if (quiz.isPending) return <QuizSkeleton />;
  if (quiz.isError) {
    if (toApiError(quiz.error).status === HTTP_NOT_FOUND) return <NotFound courseId={courseId} />;
    return (
      <div className="container-page py-10">
        <ErrorState
          error={quiz.error}
          title="Could not load this quiz"
          onRetry={() => {
            void quiz.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-page flex flex-col gap-8 py-8">
      <title>{`${quiz.data.title} · Atrium`}</title>
      <QuizHeader courseId={courseId} quiz={quiz.data} />
      {quiz.data.has_attempts ? (
        <p className="flex items-start gap-2 rounded-control bg-brand-50 px-3 py-2.5 text-small text-brand-700">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Students already took this quiz. You can fix wording, explanations and settings, but
            question types, points and correct answers are locked, and questions cannot be deleted.
          </span>
        </p>
      ) : null}
      <section
        aria-labelledby="quiz-settings-heading"
        className="max-w-2xl rounded-panel border border-line bg-surface p-6"
      >
        <h2 id="quiz-settings-heading" className="mb-4 text-h2">
          Settings
        </h2>
        <QuizSettingsForm key={quiz.data.id} courseId={courseId} quiz={quiz.data} />
      </section>
      <section aria-labelledby="quiz-questions-heading" className="max-w-3xl">
        <h2 id="quiz-questions-heading" className="mb-4 text-h2">
          Questions
        </h2>
        <QuestionList courseId={courseId} quiz={quiz.data} />
      </section>
    </div>
  );
}

export function Component() {
  const params = useParams();
  const courseId = parseId(params.courseId);
  const quizId = parseId(params.quizId);

  if (courseId === null || quizId === null) return <NotFound courseId={courseId} />;
  return <QuizView courseId={courseId} quizId={quizId} />;
}
