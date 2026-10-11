import type { LessonSummary, Program, ProgramModule, Progress } from "@/api/types";
import type {
  PathModuleStatus,
  PathModuleView,
  PathNode,
  PathNodeState,
} from "@/components/domain/path-types";
import { formatDuration } from "@/lib/dates";
import { lessonPath, quizPath } from "@/lib/paths";

import { isLessonCompleted } from "./progress-model";

interface PathInput {
  program: Program;
  progress: Progress | null;
  currentLessonId: number | null;
  fullAccess: boolean;
}

function lessonState(
  lesson: LessonSummary,
  { progress, currentLessonId, fullAccess }: PathInput,
): PathNodeState {
  if (progress && isLessonCompleted(progress, lesson.id)) return "done";
  if (!fullAccess && !lesson.is_preview) return "locked";
  return lesson.id === currentLessonId ? "current" : "upcoming";
}

function quizNode(
  module: ProgramModule,
  progress: Progress | null,
  fullAccess: boolean,
): PathNode | null {
  const quiz = progress?.modules.find((candidate) => candidate.id === module.id)?.quiz;
  if (quiz) {
    return {
      kind: "quiz",
      id: quiz.id,
      title: quiz.title,
      meta: quiz.passed ? "Passed" : "Not passed yet",
      state: quiz.passed ? "done" : "upcoming",
      href: quizPath(quiz.id, module.course_id),
    };
  }
  if (!module.has_quiz) return null;
  return {
    kind: "quiz",
    id: null,
    title: "Module quiz",
    meta: "",
    state: fullAccess ? "upcoming" : "locked",
    href: null,
  };
}

function moduleStatus(nodes: readonly PathNode[]): PathModuleStatus {
  if (nodes.length > 0 && nodes.every((node) => node.state === "locked")) return "locked";
  if (nodes.length > 0 && nodes.every((node) => node.state === "done")) return "done";
  if (nodes.some((node) => node.state === "done" || node.state === "current")) return "in-progress";
  return "idle";
}

export function buildPath(input: PathInput): PathModuleView[] {
  const { program, progress, fullAccess } = input;
  return program.modules.map((module, index) => {
    const lessonNodes: PathNode[] = module.lessons.map((lesson) => {
      const state = lessonState(lesson, input);
      return {
        kind: "lesson",
        id: lesson.id,
        title: lesson.title,
        meta: formatDuration(lesson.duration_minutes),
        state,
        href: state === "locked" ? null : lessonPath(module.course_id, lesson.id),
      };
    });
    const quiz = quizNode(module, progress, fullAccess);
    const nodes = quiz ? [...lessonNodes, quiz] : lessonNodes;
    const done = nodes.filter((node) => node.state === "done").length;
    return {
      id: module.id,
      number: index + 1,
      title: module.title,
      status: moduleStatus(nodes),
      summary: `${done} of ${nodes.length}`,
      nodes,
    };
  });
}

export function orderedProgramLessons(program: Program): LessonSummary[] {
  return program.modules.flatMap((module) => module.lessons);
}

export function neighbours(
  program: Program,
  lessonId: number,
): { previous: LessonSummary | null; next: LessonSummary | null } {
  const lessons = orderedProgramLessons(program);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return { previous: null, next: null };
  return { previous: lessons[index - 1] ?? null, next: lessons[index + 1] ?? null };
}

export function moduleOfLesson(
  program: Program,
  lessonId: number,
): { module: ProgramModule; number: number } | null {
  const index = program.modules.findIndex((module) =>
    module.lessons.some((lesson) => lesson.id === lessonId),
  );
  const module = program.modules[index];
  return module ? { module, number: index + 1 } : null;
}
