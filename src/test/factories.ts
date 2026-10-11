import type {
  Course,
  CourseListItem,
  Enrollment,
  LessonSummary,
  Program,
  ProgramModule,
  Review,
  ReviewPage,
  User,
} from "@/api/types";

export const API_URL = "http://localhost:8000";

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Andrii",
    surname: "Kovalenko",
    email: "andrii@demo.example.com",
    phone: null,
    bio: null,
    role: "student",
    email_verified: true,
    ...overrides,
  };
}

export function buildCourseListItem(overrides: Partial<CourseListItem> = {}): CourseListItem {
  return {
    id: 1,
    title: "TypeScript from zero to production",
    level: "beginner",
    price: "89.00",
    cover_url: null,
    rating_avg: 4.8,
    reviews_count: 214,
    modules_count: 3,
    created_at: "2026-01-10T09:00:00Z",
    category: { id: 1, name: "Programming" },
    teacher: { id: 7, name: "Olena", surname: "Marchenko" },
    ...overrides,
  };
}

export function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    ...buildCourseListItem(),
    description: "Learn the type system by building and shipping a typed API client.",
    status: "published",
    updated_at: null,
    teacher: { id: 7, name: "Olena", surname: "Marchenko", bio: "Senior frontend engineer" },
    ...overrides,
  };
}

export function buildEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 11,
    status: "active",
    enrolled_at: "2026-02-01T09:00:00Z",
    completed_at: null,
    course: buildCourseListItem(),
    payment: null,
    ...overrides,
  };
}

export function buildLesson(overrides: Partial<LessonSummary> = {}): LessonSummary {
  return {
    id: 101,
    title: "Why types matter",
    lesson_type: "video",
    duration_minutes: 6,
    position: 1,
    is_preview: false,
    has_video: true,
    ...overrides,
  };
}

export function buildModule(overrides: Partial<ProgramModule> = {}): ProgramModule {
  return {
    id: 51,
    course_id: 1,
    title: "Getting set up",
    position: 1,
    has_quiz: false,
    lessons: [buildLesson({ is_preview: true }), buildLesson({ id: 102, title: "Compiler" })],
    ...overrides,
  };
}

export function buildProgram(overrides: Partial<Program> = {}): Program {
  return {
    course_id: 1,
    total_lessons: 2,
    total_duration_minutes: 12,
    modules: [buildModule()],
    ...overrides,
  };
}

export function buildReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    course_id: 1,
    rating: 5,
    comment: "The quizzes after each module made me apply the material.",
    created_at: "2026-02-20T09:00:00Z",
    student: { id: 2, name: "Maria", surname: "Petrenko" },
    ...overrides,
  };
}

export function buildReviewPage(overrides: Partial<ReviewPage> = {}): ReviewPage {
  return {
    items: [buildReview()],
    total: 1,
    page: 1,
    size: 10,
    rating_avg: 4.8,
    reviews_count: 1,
    ...overrides,
  };
}
