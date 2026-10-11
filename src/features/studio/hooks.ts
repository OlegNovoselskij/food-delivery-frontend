import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import { rootKeys } from "@/api/query-keys";
import type { Course, CourseCreate, CourseUpdate } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { notify } from "@/lib/notify";

import {
  archiveCourse,
  createCourse,
  deleteCourse,
  publishCourse,
  studioKeys,
  updateCourse,
} from "./api";

export function useCourseChangeRefresh(courseId: number | null) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: studioKeys.all });
    void queryClient.invalidateQueries({ queryKey: rootKeys.catalog });
    if (courseId !== null) {
      void queryClient.invalidateQueries({ queryKey: rootKeys.course(courseId) });
    }
  }, [queryClient, courseId]);
}

export function useCreateCourse() {
  const navigate = useNavigate();
  const refresh = useCourseChangeRefresh(null);
  return useMutation({
    mutationFn: (body: CourseCreate) => createCourse(body),
    onSuccess: (course) => {
      refresh();
      notify.success("Course created. Add modules and lessons next.");
      void navigate(`/studio/courses/${course.id}`);
    },
  });
}

export function useUpdateCourse(courseId: number) {
  const refresh = useCourseChangeRefresh(courseId);
  return useMutation({
    mutationFn: (body: CourseUpdate) => updateCourse(courseId, body),
    onSuccess: () => {
      refresh();
      notify.success("Course details saved.");
    },
  });
}

export function useCourseStatusActions(course: Pick<Course, "id" | "title">) {
  const refresh = useCourseChangeRefresh(course.id);
  const confirm = useConfirm();
  const navigate = useNavigate();

  const publish = useMutation({
    mutationFn: () => publishCourse(course.id),
    onSuccess: () => {
      refresh();
      notify.success("Course published. It is now visible in the catalog.");
    },
  });

  const archive = useMutation({
    mutationFn: () => archiveCourse(course.id),
    onSuccess: () => {
      refresh();
      notify.success("Course archived. It is hidden from the catalog.");
    },
    onError: notify.error,
  });

  const remove = useMutation({
    mutationFn: () => deleteCourse(course.id),
    onSuccess: () => {
      refresh();
      notify.success("Course deleted.");
      void navigate("/studio");
    },
    onError: notify.error,
  });

  const { mutate: archiveMutate } = archive;
  const { mutate: removeMutate } = remove;

  const confirmArchive = useCallback(async (): Promise<void> => {
    const confirmed = await confirm({
      title: "Archive this course?",
      description: `${course.title} will disappear from the catalog. Students who are enrolled keep their access.`,
      confirmLabel: "Archive course",
      cancelLabel: "Keep published",
      tone: "danger",
    });
    if (confirmed) archiveMutate();
  }, [confirm, course.title, archiveMutate]);

  const confirmDelete = useCallback(async (): Promise<void> => {
    const confirmed = await confirm({
      title: "Delete this draft?",
      description: `${course.title} and all its modules, lessons and files will be deleted. This cannot be undone.`,
      confirmLabel: "Delete course",
      cancelLabel: "Keep draft",
      tone: "danger",
    });
    if (confirmed) removeMutate();
  }, [confirm, course.title, removeMutate]);

  return { publish, archive, remove, confirmArchive, confirmDelete };
}
