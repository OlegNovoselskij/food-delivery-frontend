export function coursePath(courseId: number): string {
  return `/courses/${courseId}`;
}

export function learnPath(courseId: number): string {
  return `/learning/courses/${courseId}`;
}

export function lessonPath(courseId: number, lessonId: number): string {
  return `/learning/courses/${courseId}/lessons/${lessonId}`;
}

function withCourse(path: string, courseId: number | null): string {
  return courseId === null ? path : `${path}?course=${courseId}`;
}

export function quizPath(quizId: number, courseId: number | null = null): string {
  return withCourse(`/learning/quizzes/${quizId}`, courseId);
}

export function attemptPath(attemptId: number, courseId: number | null = null): string {
  return withCourse(`/learning/attempts/${attemptId}`, courseId);
}
