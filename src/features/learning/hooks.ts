import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { Progress } from "@/api/types";
import { certificateKeys } from "@/features/certificates";
import { enrollmentKeys } from "@/features/enrollment";
import { notify } from "@/lib/notify";

import {
  fetchMaterialUrl,
  learningKeys,
  markLessonComplete,
  markLessonIncomplete,
  videoUrlQuery,
} from "./api";
import { applyLessonToggle } from "./progress-model";
import {
  SEEK_SECONDS,
  clampSeek,
  isInteractiveTarget,
  shortcutFor,
  shouldApplyVideoUrl,
  type PlayerShortcut,
} from "./video";

interface CompletionVariables {
  lessonId: number;
  completed: boolean;
}

const COURSE_COMPLETED_STATUS = "completed";

export function useLessonCompletion(enrollmentId: number) {
  const queryClient = useQueryClient();
  const key = learningKeys.progress(enrollmentId);

  return useMutation({
    mutationFn: ({ lessonId, completed }: CompletionVariables) =>
      completed
        ? markLessonComplete(enrollmentId, lessonId)
        : markLessonIncomplete(enrollmentId, lessonId),
    onMutate: async ({ lessonId, completed }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Progress>(key);
      if (previous) queryClient.setQueryData(key, applyLessonToggle(previous, lessonId, completed));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      notify.error(error);
    },
    onSuccess: (progress, variables) => {
      queryClient.setQueryData(key, progress);
      void queryClient.invalidateQueries({ queryKey: enrollmentKeys.all, refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: learningKeys.history });
      if (progress.enrollment_status === COURSE_COMPLETED_STATUS) {
        void queryClient.invalidateQueries({ queryKey: certificateKeys.all });
        notify.success("Course completed. Your certificate is on its way.");
      } else if (variables.completed) {
        notify.success("Lesson marked as complete.");
      }
    },
  });
}

export function useDownloadMaterial() {
  return useMutation({
    mutationFn: fetchMaterialUrl,
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: notify.error,
  });
}

interface ResumePoint {
  time: number;
  play: boolean;
}

export function useVideoSource(lessonId: number, videoRef: RefObject<HTMLVideoElement | null>) {
  const query = useQuery(videoUrlQuery(lessonId, true));
  const [src, setSrc] = useState<string | null>(null);
  const pendingUrl = useRef<string | null>(null);
  const resume = useRef<ResumePoint | null>(null);
  const url = query.data?.url ?? null;
  const { refetch } = query;

  useEffect(() => {
    if (url === null) return;
    const video = videoRef.current;
    const playing = video !== null && !video.paused && !video.ended;
    if (shouldApplyVideoUrl(src, url, playing)) {
      setSrc(url);
    } else if (url !== src) {
      pendingUrl.current = url;
    }
  }, [url, src, videoRef]);

  const onPause = useCallback(() => {
    if (pendingUrl.current === null) return;
    setSrc(pendingUrl.current);
    pendingUrl.current = null;
  }, []);

  const onError = useCallback(() => {
    const video = videoRef.current;
    if (video !== null) resume.current = { time: video.currentTime, play: !video.paused };
    void refetch().then((result) => {
      if (result.data) setSrc(result.data.url);
    });
  }, [refetch, videoRef]);

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const point = resume.current;
    if (video === null || point === null) return;
    video.currentTime = point.time;
    if (point.play) void video.play();
    resume.current = null;
  }, [videoRef]);

  return {
    src,
    isPending: query.isPending,
    error: query.error,
    retry: () => {
      void refetch();
    },
    handlers: { onPause, onError, onLoadedMetadata },
  };
}

function runShortcut(video: HTMLVideoElement, shortcut: PlayerShortcut): void {
  switch (shortcut) {
    case "toggle-play":
      if (video.paused) void video.play();
      else video.pause();
      break;
    case "seek-back":
      video.currentTime = clampSeek(video.currentTime, -SEEK_SECONDS, video.duration);
      break;
    case "seek-forward":
      video.currentTime = clampSeek(video.currentTime, SEEK_SECONDS, video.duration);
      break;
    case "toggle-mute":
      video.muted = !video.muted;
      break;
  }
}

export function usePlayerShortcuts(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isInteractiveTarget(event.target)) return;
      const shortcut = shortcutFor(event.key);
      const video = videoRef.current;
      if (shortcut === null || video === null) return;
      event.preventDefault();
      runShortcut(video, shortcut);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [videoRef, enabled]);
}
