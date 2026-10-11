import { useQuery } from "@tanstack/react-query";
import { Eye, SearchX } from "lucide-react";
import { Link, useParams } from "react-router";

import { toApiError } from "@/api/errors";
import type { Course } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FormError } from "@/components/feedback/form-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courseDetailQuery } from "@/features/course";
import { parseId } from "@/lib/ids";

import { builderProgramQuery } from "../builder/api";
import { CurriculumBuilder } from "../builder/components/curriculum-builder";
import { LessonEditor } from "../builder/components/lesson-editor";
import { CourseForm } from "../components/course-form";
import { CourseStatusBadge } from "../components/course-status-badge";
import { useCourseStatusActions, useUpdateCourse } from "../hooks";
import { canArchive, canDelete, canPublish } from "../status";

const HTTP_NOT_FOUND = 404;

function BuilderSkeleton() {
  return (
    <div role="status" aria-label="Loading course builder" className="p-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-4 h-10 w-2/3 max-w-xl" />
      <Skeleton className="mt-8 h-40 rounded-card" />
      <Skeleton className="mt-5 h-40 rounded-card" />
    </div>
  );
}

function BuilderHeader({ course }: { course: Course }) {
  const actions = useCourseStatusActions(course);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <CourseStatusBadge status={course.status} />
        </div>
        <h1 className="mt-2 text-h1">{course.title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary">
          <Link to={`/courses/${course.id}`}>
            <Eye aria-hidden="true" />
            Preview
          </Link>
        </Button>
        {canPublish(course.status) ? (
          <Button
            disabled={actions.publish.isPending}
            onClick={() => {
              actions.publish.mutate();
            }}
          >
            {actions.publish.isPending ? "Publishing" : "Publish course"}
          </Button>
        ) : null}
        {canArchive(course.status) ? (
          <Button
            variant="secondary"
            disabled={actions.archive.isPending}
            onClick={() => {
              void actions.confirmArchive();
            }}
          >
            Archive course
          </Button>
        ) : null}
        {canDelete(course.status) ? (
          <Button
            variant="ghost"
            disabled={actions.remove.isPending}
            onClick={() => {
              void actions.confirmDelete();
            }}
          >
            Delete draft
          </Button>
        ) : null}
      </div>
      {actions.publish.isError ? (
        <FormError
          className="w-full"
          message={`Course not published. ${toApiError(actions.publish.error).message}`}
        />
      ) : null}
    </header>
  );
}

function SettingsTab({ course }: { course: Course }) {
  const update = useUpdateCourse(course.id);
  return (
    <div className="max-w-2xl rounded-panel border border-line bg-surface p-6">
      <CourseForm
        course={course}
        submitLabel="Save details"
        pendingLabel="Saving"
        pending={update.isPending}
        onSubmit={(payload, onServerError) => {
          update.mutate(payload, { onError: onServerError });
        }}
      />
    </div>
  );
}

function LessonPanel({ courseId, lessonId }: { courseId: number; lessonId: number | null }) {
  if (lessonId === null) {
    return (
      <div>
        <h2 className="text-h3 font-semibold">Lesson details</h2>
        <p className="mt-2 text-muted">
          Select a lesson in the curriculum to edit its text, video and files, or add a lesson to a
          module.
        </p>
      </div>
    );
  }
  return <LessonEditor key={lessonId} courseId={courseId} lessonId={lessonId} />;
}

function BuilderView({ courseId, lessonId }: { courseId: number; lessonId: number | null }) {
  const course = useQuery({ ...courseDetailQuery(courseId), staleTime: 0 });
  const program = useQuery(builderProgramQuery(courseId));

  if (course.isPending) return <BuilderSkeleton />;
  if (course.isError) {
    if (toApiError(course.error).status === HTTP_NOT_FOUND) {
      return (
        <div className="container-page py-10">
          <EmptyState
            icon={SearchX}
            title="Course not found"
            description="This course does not exist or belongs to another teacher."
            action={
              <Button asChild>
                <Link to="/studio">Back to teaching</Link>
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <div className="container-page py-10">
        <ErrorState
          error={course.error}
          title="Could not load this course"
          onRetry={() => {
            void course.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-68px)] lg:grid-cols-[minmax(0,1fr)_420px]">
      <title>{`${course.data.title} · Atrium`}</title>
      <div className="min-w-0 p-4 sm:p-6">
        <BuilderHeader course={course.data} />
        <Tabs defaultValue="curriculum" className="mt-6">
          <TabsList aria-label="Course sections">
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="curriculum">
            {program.isPending ? <BuilderSkeleton /> : null}
            {program.isError ? (
              <ErrorState
                error={program.error}
                title="Could not load the curriculum"
                onRetry={() => {
                  void program.refetch();
                }}
              />
            ) : null}
            {program.data ? (
              <CurriculumBuilder
                courseId={courseId}
                program={program.data}
                selectedLessonId={lessonId}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab course={course.data} />
          </TabsContent>
        </Tabs>
      </div>
      <aside
        aria-label="Lesson editor"
        className="border-t border-line bg-surface p-4 sm:p-6 lg:border-t-0 lg:border-l"
      >
        <LessonPanel courseId={courseId} lessonId={lessonId} />
      </aside>
    </div>
  );
}

export function Component() {
  const params = useParams();
  const courseId = parseId(params.courseId);
  const lessonId = parseId(params.lessonId);

  if (courseId === null) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={SearchX}
          title="Course not found"
          description="The address of this course is not valid."
        />
      </div>
    );
  }
  return <BuilderView courseId={courseId} lessonId={lessonId} />;
}
