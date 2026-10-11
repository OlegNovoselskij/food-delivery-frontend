import { arrayMove } from "@dnd-kit/sortable";

import type { LessonSummary, Program, ProgramModule } from "@/api/types";

export function moveId(ids: readonly number[], activeId: number, overId: number): number[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return [...ids];
  return arrayMove([...ids], from, to);
}

export function withModulesOrder(program: Program, orderedIds: readonly number[]): Program {
  const byId = new Map(program.modules.map((module) => [module.id, module]));
  const modules = orderedIds.flatMap((id, index) => {
    const module = byId.get(id);
    return module ? [{ ...module, position: index + 1 }] : [];
  });
  return modules.length === program.modules.length ? { ...program, modules } : program;
}

export function withLessonsOrder(
  program: Program,
  moduleId: number,
  orderedIds: readonly number[],
): Program {
  return {
    ...program,
    modules: program.modules.map((module) => {
      if (module.id !== moduleId) return module;
      const byId = new Map(module.lessons.map((lesson) => [lesson.id, lesson]));
      const lessons = orderedIds.flatMap((id, index) => {
        const lesson = byId.get(id);
        return lesson ? [{ ...lesson, position: index + 1 }] : [];
      });
      return lessons.length === module.lessons.length ? { ...module, lessons } : module;
    }),
  };
}

export function withModule(program: Program, updated: ProgramModule): Program {
  return {
    ...program,
    modules: program.modules.map((module) => (module.id === updated.id ? updated : module)),
  };
}

export function withModuleTitle(program: Program, moduleId: number, title: string): Program {
  return {
    ...program,
    modules: program.modules.map((module) =>
      module.id === moduleId ? { ...module, title } : module,
    ),
  };
}

export function withoutModule(program: Program, moduleId: number): Program {
  return { ...program, modules: program.modules.filter((module) => module.id !== moduleId) };
}

export function withoutLesson(program: Program, lessonId: number): Program {
  return {
    ...program,
    modules: program.modules.map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
    })),
  };
}

export function findLesson(program: Program, lessonId: number): LessonSummary | null {
  for (const module of program.modules) {
    const lesson = module.lessons.find((candidate) => candidate.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

export function lessonStatus(lesson: LessonSummary): "video-ready" | "no-video" | "article" {
  if (lesson.lesson_type !== "video") return "article";
  return lesson.has_video ? "video-ready" : "no-video";
}
