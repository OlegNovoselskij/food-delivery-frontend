import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import type { LessonCreate, LessonUpdate } from "@/api/types";
import { unwrap, unwrapEmpty } from "@/api/unwrap";
import { courseProgramQuery } from "@/features/course";

export function builderProgramQuery(courseId: number) {
  return queryOptions({ ...courseProgramQuery(courseId), staleTime: 0 });
}

export function createModule(courseId: number, title: string) {
  return unwrap(
    api.POST("/api/v1/courses/{course_id}/modules", {
      params: { path: { course_id: courseId } },
      body: { title },
    }),
  );
}

export function renameModule(moduleId: number, title: string) {
  return unwrap(
    api.PATCH("/api/v1/modules/{module_id}", {
      params: { path: { module_id: moduleId } },
      body: { title },
    }),
  );
}

export function deleteModule(moduleId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/modules/{module_id}", { params: { path: { module_id: moduleId } } }),
  );
}

export function reorderModules(courseId: number, ids: number[]) {
  return unwrap(
    api.PUT("/api/v1/courses/{course_id}/modules/order", {
      params: { path: { course_id: courseId } },
      body: { ids },
    }),
  );
}

export function createLesson(moduleId: number, body: LessonCreate) {
  return unwrap(
    api.POST("/api/v1/modules/{module_id}/lessons", {
      params: { path: { module_id: moduleId } },
      body,
    }),
  );
}

export function reorderLessons(moduleId: number, ids: number[]) {
  return unwrap(
    api.PUT("/api/v1/modules/{module_id}/lessons/order", {
      params: { path: { module_id: moduleId } },
      body: { ids },
    }),
  );
}

export function updateLesson(lessonId: number, body: LessonUpdate) {
  return unwrap(
    api.PATCH("/api/v1/lessons/{lesson_id}", { params: { path: { lesson_id: lessonId } }, body }),
  );
}

export function deleteLesson(lessonId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/lessons/{lesson_id}", { params: { path: { lesson_id: lessonId } } }),
  );
}
