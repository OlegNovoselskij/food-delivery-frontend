import { SEED_USERS, seedToken } from "./api";

const API_URL = "http://localhost:8000/api/v1";
const CATEGORY_ID = 1;

export interface QuizCourse {
  courseId: number;
  lessonId: number;
  quizId: number;
  moduleId: number;
  title: string;
  token: string;
}

async function call<T>(token: string, path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

interface Created {
  id: number;
}

export async function createQuizCourse(price = "0"): Promise<QuizCourse> {
  const token = await seedToken(SEED_USERS.scratchTeacher);
  const title = `E2E quiz course ${Date.now()}`;
  const course = await call<Created>(token, "/courses", "POST", {
    category_id: CATEGORY_ID,
    title,
    description: "Created by the end-to-end tests.",
    level: "beginner",
    price,
  });
  const module = await call<Created>(token, `/courses/${course.id}/modules`, "POST", {
    title: "Basics",
  });
  const lesson = await call<Created>(token, `/modules/${module.id}/lessons`, "POST", {
    title: "Read first",
    lesson_type: "article",
    content: "Read this before the quiz.",
    duration_minutes: 5,
    is_preview: true,
  });
  const quiz = await call<Created>(token, `/modules/${module.id}/quiz`, "POST", {
    title: "Basics checkpoint",
    passing_score: 60,
    max_attempts: 5,
  });
  await call(token, `/quizzes/${quiz.id}/questions`, "POST", {
    text: "Which keyword declares a constant?",
    question_type: "single_choice",
    points: 1,
    explanation: "const declares a binding that cannot be reassigned.",
    options: [
      { text: "const", is_correct: true },
      { text: "var", is_correct: false },
    ],
  });
  await call(token, `/quizzes/${quiz.id}/questions`, "POST", {
    text: "Which of these are primitive types?",
    question_type: "multiple_choice",
    points: 1,
    options: [
      { text: "string", is_correct: true },
      { text: "number", is_correct: true },
      { text: "object", is_correct: false },
    ],
  });
  await call(token, `/courses/${course.id}/publish`, "POST");
  return {
    courseId: course.id,
    lessonId: lesson.id,
    quizId: quiz.id,
    moduleId: module.id,
    title,
    token,
  };
}

export async function archiveCourse(course: QuizCourse): Promise<void> {
  await call(course.token, `/courses/${course.courseId}/archive`, "POST");
}

export interface DraftCourse {
  courseId: number;
  token: string;
}

export async function createDraftCourse(withModule: boolean): Promise<DraftCourse> {
  const token = await seedToken(SEED_USERS.scratchTeacher);
  const course = await call<Created>(token, "/courses", "POST", {
    category_id: CATEGORY_ID,
    title: `E2E draft ${Date.now()}`,
    description: "A draft course used for screenshots.",
    level: "beginner",
    price: "0",
  });
  if (withModule) {
    await call<Created>(token, `/courses/${course.id}/modules`, "POST", { title: "First module" });
  }
  return { courseId: course.id, token };
}

export async function deleteDraftCourse(draft: DraftCourse): Promise<void> {
  const response = await fetch(`${API_URL}/courses/${draft.courseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${draft.token}` },
  });
  if (!response.ok) throw new Error(`Delete draft failed: ${response.status}`);
}

export interface VideoLessonCourse extends DraftCourse {
  lessonId: number;
  title: string;
}

export async function createCourseWithVideoLesson(): Promise<VideoLessonCourse> {
  const token = await seedToken(SEED_USERS.scratchTeacher);
  const title = `E2E upload ${Date.now()}`;
  const course = await call<Created>(token, "/courses", "POST", {
    category_id: CATEGORY_ID,
    title,
    description: "Created by the upload tests.",
    level: "beginner",
    price: "0",
  });
  const module = await call<Created>(token, `/courses/${course.id}/modules`, "POST", {
    title: "Uploads",
  });
  const lesson = await call<Created>(token, `/modules/${module.id}/lessons`, "POST", {
    title: "Upload me",
    lesson_type: "video",
    duration_minutes: 1,
    is_preview: true,
  });
  return { courseId: course.id, lessonId: lesson.id, token, title };
}

export async function archivePublishedCourse(courseId: number, token: string): Promise<void> {
  await call(token, `/courses/${courseId}/archive`, "POST");
}
