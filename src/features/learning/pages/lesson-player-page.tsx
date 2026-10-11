import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";

import { toApiError } from "@/api/errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import {
  courseDetailQuery,
  courseProgramQuery,
  hasFullAccess,
  resolveCourseAccess,
} from "@/features/course";
import { useCourseEnrollment } from "@/features/enrollment";
import { parseId } from "@/lib/ids";
import { coursePath, lessonPath } from "@/lib/paths";

import { lessonQuery, progressQuery } from "../api";
import { LessonActions } from "../components/lesson-actions";
import { LessonLocked } from "../components/lesson-locked";
import { LessonMaterials } from "../components/lesson-materials";
import { LessonVideo } from "../components/lesson-video";
import { PathSidebar } from "../components/path-sidebar";
import { PlayerHeader } from "../components/player-header";
import { useLessonCompletion } from "../hooks";
import { buildPath, moduleOfLesson, neighbours } from "../path";
import { isLessonCompleted, moduleFractions } from "../progress-model";

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const NO_ENROLLMENT_ID = 0;

function PlayerSkeleton() {
  return (
    <div role="status" aria-label="Loading lesson" className="flex min-h-screen flex-col">
      <Skeleton className="h-[68px] rounded-none" />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="aspect-video w-full rounded-panel" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="hidden rounded-none lg:block" />
      </div>
    </div>
  );
}

function PlayerMessage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-16">{children}</div>;
}

function PlayerView({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const { session } = useAuth();
  const { pathname, search } = useLocation();
  const [pathOpen, setPathOpen] = useState(false);
  const course = useQuery(courseDetailQuery(courseId));
  const program = useQuery(courseProgramQuery(courseId));
  const lesson = useQuery(lessonQuery(lessonId));
  const enrollment = useCourseEnrollment(courseId);

  const access = course.data
    ? resolveCourseAccess({ session, course: course.data, enrollment: enrollment.data })
    : null;
  const learnerEnrollment = access?.kind === "learning" ? access.enrollment : null;
  const progress = useQuery(
    progressQuery(learnerEnrollment?.id ?? NO_ENROLLMENT_ID, learnerEnrollment !== null),
  );
  const completion = useLessonCompletion(learnerEnrollment?.id ?? NO_ENROLLMENT_ID);

  if (lesson.isError) {
    const { status } = toApiError(lesson.error);
    if (status === HTTP_FORBIDDEN) {
      return (
        <PlayerMessage>
          <LessonLocked
            courseId={courseId}
            signedIn={session.status === "authenticated"}
            currentPath={`${pathname}${search}`}
          />
        </PlayerMessage>
      );
    }
    if (status === HTTP_NOT_FOUND) {
      return (
        <PlayerMessage>
          <EmptyState
            icon={SearchX}
            title="Lesson not found"
            description="This lesson does not exist or was removed from the course."
            action={
              <Button asChild>
                <Link to={coursePath(courseId)}>Back to course</Link>
              </Button>
            }
          />
        </PlayerMessage>
      );
    }
    return (
      <PlayerMessage>
        <ErrorState
          error={lesson.error}
          title="Could not load this lesson"
          onRetry={() => {
            void lesson.refetch();
          }}
        />
      </PlayerMessage>
    );
  }

  if (!course.data || !program.data || !lesson.data || !access) {
    if (course.isError || program.isError) {
      return (
        <PlayerMessage>
          <ErrorState
            error={course.error ?? program.error}
            title="Could not load the course"
            onRetry={() => {
              void course.refetch();
              void program.refetch();
            }}
          />
        </PlayerMessage>
      );
    }
    return <PlayerSkeleton />;
  }

  const lessonData = lesson.data;
  const programData = program.data;
  const fullAccess = hasFullAccess(access);
  const progressData = progress.data ?? null;
  const completed = progressData !== null && isLessonCompleted(progressData, lessonId);
  const { next } = neighbours(programData, lessonId);
  const nextHref = next && (fullAccess || next.is_preview) ? lessonPath(courseId, next.id) : null;
  const located = moduleOfLesson(programData, lessonId);
  const pathModules = buildPath({
    program: programData,
    progress: progressData,
    currentLessonId: lessonId,
    fullAccess,
  });
  const sidebar = (
    <PathSidebar
      modules={pathModules}
      fractions={progressData ? moduleFractions(progressData) : null}
      lessonsDone={progressData ? progressData.progress.lessons_completed : null}
      lessonsTotal={programData.total_lessons}
      onNavigate={() => {
        setPathOpen(false);
      }}
    />
  );

  return (
    <div className="flex min-h-screen flex-col">
      <title>{`${lessonData.title} · Atrium`}</title>
      <PlayerHeader
        courseTitle={course.data.title}
        backTo={access.kind === "learning" ? "/learning" : coursePath(courseId)}
        backLabel={access.kind === "learning" ? "My learning" : "Course"}
        percent={progressData ? progressData.progress.percent : null}
        onOpenPath={() => {
          setPathOpen(true);
        }}
      />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 p-4 sm:p-6">
          <LessonVideo
            lessonId={lessonId}
            title={lessonData.title}
            hasVideo={lessonData.has_video}
            isVideoLesson={lessonData.lesson_type === "video"}
          />
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {located ? (
                <p className="text-muted">
                  Module {located.number} · {located.module.title}
                </p>
              ) : null}
              <h1 className="mt-1 text-h1">{lessonData.title}</h1>
            </div>
            <LessonActions
              canTrackProgress={learnerEnrollment !== null}
              completed={completed}
              pending={completion.isPending || progress.isPending}
              onToggle={() => {
                completion.mutate({ lessonId, completed: !completed });
              }}
              nextHref={nextHref}
            />
          </div>
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList aria-label="Lesson sections">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="materials">Materials ({lessonData.materials.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              {lessonData.content ? (
                <p className="max-w-3xl whitespace-pre-wrap text-ink-soft">{lessonData.content}</p>
              ) : (
                <p className="text-muted">This lesson has no written description.</p>
              )}
            </TabsContent>
            <TabsContent value="materials">
              <LessonMaterials materials={lessonData.materials} />
            </TabsContent>
          </Tabs>
        </div>
        <aside
          aria-label="Course path"
          className="hidden border-l border-line bg-surface p-6 lg:sticky lg:top-[68px] lg:block lg:h-[calc(100vh-68px)] lg:overflow-y-auto"
        >
          {sidebar}
        </aside>
      </div>
      <Sheet open={pathOpen} onOpenChange={setPathOpen}>
        <SheetContent side="right" className="pt-14">
          <SheetTitle className="sr-only">Course path</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Component() {
  const params = useParams();
  const courseId = parseId(params.courseId);
  const lessonId = parseId(params.lessonId);

  if (courseId === null || lessonId === null) {
    return (
      <PlayerMessage>
        <EmptyState
          icon={SearchX}
          title="Lesson not found"
          description="The address of this lesson is not valid."
          action={
            <Button asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          }
        />
      </PlayerMessage>
    );
  }

  return <PlayerView key={lessonId} courseId={courseId} lessonId={lessonId} />;
}
