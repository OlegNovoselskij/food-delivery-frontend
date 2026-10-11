import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import type { Lesson, LessonCreate, LessonUpdate, Program, ProgramModule } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { courseKeys } from "@/features/course";
import { learningKeys } from "@/features/learning";
import { notify } from "@/lib/notify";

import { useCourseChangeRefresh } from "../hooks";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  renameModule,
  reorderLessons,
  reorderModules,
  updateLesson,
} from "./api";
import {
  withLessonsOrder,
  withModule,
  withModuleTitle,
  withModulesOrder,
  withoutLesson,
  withoutModule,
} from "./program-model";

function useProgramCache(courseId: number) {
  const queryClient = useQueryClient();
  const key = courseKeys.program(courseId);
  const refresh = useCourseChangeRefresh(courseId);

  const read = useCallback(() => queryClient.getQueryData<Program>(key), [queryClient, key]);
  const write = useCallback(
    (update: (program: Program) => Program) => {
      queryClient.setQueryData<Program>(key, (program) => (program ? update(program) : program));
    },
    [queryClient, key],
  );
  const cancel = useCallback(
    () => queryClient.cancelQueries({ queryKey: key }),
    [queryClient, key],
  );

  return { read, write, cancel, refresh, queryClient, key };
}

export function useAddModule(courseId: number) {
  const { write, refresh } = useProgramCache(courseId);
  return useMutation({
    mutationFn: (title: string) => createModule(courseId, title),
    onSuccess: (module) => {
      write((program) => ({ ...program, modules: [...program.modules, module] }));
      refresh();
    },
    onError: notify.error,
  });
}

export function useRenameModule(courseId: number) {
  const { read, write, cancel, refresh } = useProgramCache(courseId);
  return useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: number; title: string }) =>
      renameModule(moduleId, title),
    onMutate: async ({ moduleId, title }) => {
      await cancel();
      const previous = read();
      write((program) => withModuleTitle(program, moduleId, title));
      return { previous };
    },
    onError: (error, _variables, context) => {
      const previous = context?.previous;
      if (previous) write(() => previous);
      notify.error(error);
    },
    onSettled: refresh,
  });
}

export function useDeleteModule(courseId: number) {
  const { write, refresh } = useProgramCache(courseId);
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: (module: ProgramModule) => deleteModule(module.id),
    onSuccess: (_result, module) => {
      write((program) => withoutModule(program, module.id));
      refresh();
      notify.success("Module deleted.");
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(
    async (module: ProgramModule): Promise<void> => {
      const count = module.lessons.length;
      const confirmed = await confirm({
        title: "Delete this module?",
        description: `${module.title} and its ${count} ${count === 1 ? "lesson" : "lessons"}, files and quiz will be deleted. This cannot be undone.`,
        confirmLabel: "Delete module",
        cancelLabel: "Keep module",
        tone: "danger",
      });
      if (confirmed) mutate(module);
    },
    [confirm, mutate],
  );

  return { remove, isPending: mutation.isPending };
}

export function useReorderModules(courseId: number) {
  const { read, write, cancel, refresh } = useProgramCache(courseId);
  return useMutation({
    mutationFn: (ids: number[]) => reorderModules(courseId, ids),
    onMutate: async (ids) => {
      await cancel();
      const previous = read();
      write((program) => withModulesOrder(program, ids));
      return { previous };
    },
    onError: (error, _ids, context) => {
      const previous = context?.previous;
      if (previous) write(() => previous);
      notify.error(error);
    },
    onSuccess: (program) => {
      write(() => program);
    },
    onSettled: refresh,
  });
}

export function useAddLesson(courseId: number) {
  const { refresh } = useProgramCache(courseId);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: number; body: LessonCreate }) =>
      createLesson(moduleId, body),
    onSuccess: (lesson) => {
      refresh();
      void navigate(`/studio/courses/${courseId}/lessons/${lesson.id}`);
    },
    onError: notify.error,
  });
}

export function useReorderLessons(courseId: number) {
  const { read, write, cancel, refresh } = useProgramCache(courseId);
  return useMutation({
    mutationFn: ({ moduleId, ids }: { moduleId: number; ids: number[] }) =>
      reorderLessons(moduleId, ids),
    onMutate: async ({ moduleId, ids }) => {
      await cancel();
      const previous = read();
      write((program) => withLessonsOrder(program, moduleId, ids));
      return { previous };
    },
    onError: (error, _variables, context) => {
      const previous = context?.previous;
      if (previous) write(() => previous);
      notify.error(error);
    },
    onSuccess: (module) => {
      write((program) => withModule(program, module));
    },
    onSettled: refresh,
  });
}

export function useUpdateLesson(courseId: number, lessonId: number) {
  const queryClient = useQueryClient();
  const { refresh } = useProgramCache(courseId);
  return useMutation({
    mutationFn: (body: LessonUpdate) => updateLesson(lessonId, body),
    onSuccess: (lesson: Lesson) => {
      queryClient.setQueryData(learningKeys.lesson(lessonId), lesson);
      refresh();
      notify.success("Lesson saved.");
    },
  });
}

export function useDeleteLesson(courseId: number) {
  const { write, refresh } = useProgramCache(courseId);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (lesson: { id: number; title: string }) => deleteLesson(lesson.id),
    onSuccess: (_result, lesson) => {
      write((program) => withoutLesson(program, lesson.id));
      refresh();
      notify.success("Lesson deleted.");
      void navigate(`/studio/courses/${courseId}`);
    },
    onError: notify.error,
  });
  const { mutate } = mutation;

  const remove = useCallback(
    async (lesson: { id: number; title: string }): Promise<void> => {
      const confirmed = await confirm({
        title: "Delete this lesson?",
        description: `${lesson.title} and its video and materials will be deleted. This cannot be undone.`,
        confirmLabel: "Delete lesson",
        cancelLabel: "Keep lesson",
        tone: "danger",
      });
      if (confirmed) mutate(lesson);
    },
    [confirm, mutate],
  );

  return { remove, isPending: mutation.isPending };
}
