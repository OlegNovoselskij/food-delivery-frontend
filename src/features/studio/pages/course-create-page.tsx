import { Link } from "react-router";

import { CourseForm } from "../components/course-form";
import { useCreateCourse } from "../hooks";

export function Component() {
  const create = useCreateCourse();

  return (
    <div className="container-page max-w-3xl py-10">
      <title>New course · Atrium</title>
      <Link to="/studio" className="text-small font-semibold text-brand-700 hover:underline">
        Back to teaching
      </Link>
      <h1 className="mt-3 text-h1">Create a course</h1>
      <p className="mt-2 mb-8 text-muted">
        Start with the basics. You add modules, lessons and quizzes in the next step, and publish
        when it is ready.
      </p>
      <div className="rounded-panel border border-line bg-surface p-6">
        <CourseForm
          course={null}
          submitLabel="Create course"
          pendingLabel="Creating course"
          pending={create.isPending}
          onSubmit={(payload, onServerError) => {
            create.mutate(payload, { onError: onServerError });
          }}
        />
      </div>
    </div>
  );
}
