import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import { toApiError } from "@/api/errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useCourseEnrollment } from "@/features/enrollment";

import { hasFullAccess, resolveCourseAccess } from "../access";
import { courseDetailQuery, courseProgramQuery } from "../api";
import { CourseHeader } from "../components/course-header";
import { CourseSkeleton, ProgramSkeleton } from "../components/course-skeleton";
import { EnrollCard } from "../components/enroll-card";
import { ProgramAccordion } from "../components/program-accordion";
import { ReviewsPanel } from "../components/reviews-panel";
import { TeacherPanel } from "../components/teacher-panel";
import { parseCourseId } from "../course-id";

const HTTP_NOT_FOUND = 404;
const TABS = ["program", "reviews", "teacher"] as const;

type CourseTab = (typeof TABS)[number];

function isCourseTab(value: string | null): value is CourseTab {
  return TABS.some((tab) => tab === value);
}

function CourseNotFound() {
  return (
    <div className="container-page py-10">
      <title>Course not found · Atrium</title>
      <EmptyState
        icon={SearchX}
        title="Course not found"
        description="This course does not exist, or it is not published yet."
        action={
          <Button asChild>
            <Link to="/courses">Browse courses</Link>
          </Button>
        }
      />
    </div>
  );
}

function CourseView({ courseId }: { courseId: number }) {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const course = useQuery(courseDetailQuery(courseId));
  const program = useQuery(courseProgramQuery(courseId));
  const enrollment = useCourseEnrollment(courseId);

  if (course.isPending) return <CourseSkeleton />;

  if (course.isError) {
    if (toApiError(course.error).status === HTTP_NOT_FOUND) return <CourseNotFound />;
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

  const access = resolveCourseAccess({ session, course: course.data, enrollment: enrollment.data });
  const tabParam = params.get("tab");
  const tab: CourseTab = isCourseTab(tabParam) ? tabParam : "program";

  return (
    <div className="container-page py-10">
      <title>{`${course.data.title} · Atrium`}</title>
      <CourseHeader course={course.data} />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 min-w-0 lg:order-1">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              setParams(isCourseTab(value) && value !== "program" ? { tab: value } : {}, {
                replace: true,
              });
            }}
          >
            <TabsList aria-label="Course sections">
              <TabsTrigger value="program">Program</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
            </TabsList>
            <TabsContent value="program">
              {program.isPending ? <ProgramSkeleton /> : null}
              {program.isError ? (
                <ErrorState
                  error={program.error}
                  title="Could not load the program"
                  onRetry={() => {
                    void program.refetch();
                  }}
                />
              ) : null}
              {program.data ? (
                <ProgramAccordion
                  courseId={courseId}
                  program={program.data}
                  fullAccess={hasFullAccess(access)}
                />
              ) : null}
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewsPanel courseId={courseId} />
            </TabsContent>
            <TabsContent value="teacher">
              <TeacherPanel course={course.data} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="order-1 lg:order-2">
          <EnrollCard course={course.data} program={program.data} access={access} />
        </div>
      </div>
    </div>
  );
}

export function Component() {
  const { courseId } = useParams();
  const parsed = parseCourseId(courseId);
  if (parsed === null) return <CourseNotFound />;
  return <CourseView courseId={parsed} />;
}
