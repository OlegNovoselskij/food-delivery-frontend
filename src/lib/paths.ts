export function coursePath(courseId: number): string {
  return `/courses/${courseId}`;
}

export function learnPath(courseId: number): string {
  return `/learning/courses/${courseId}`;
}

export function lessonPath(courseId: number, lessonId: number): string {
  return `/learning/courses/${courseId}/lessons/${lessonId}`;
}

export function quizPath(quizId: number): string {
  return `/learning/quizzes/${quizId}`;
}
