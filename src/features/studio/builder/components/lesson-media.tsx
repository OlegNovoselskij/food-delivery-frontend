import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Video } from "lucide-react";
import { useCallback, useState } from "react";

import type { Lesson } from "@/api/types";
import { useConfirm } from "@/components/domain/confirm-provider";
import { FileDropzone } from "@/components/domain/file-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { learningKeys } from "@/features/learning";
import { useUploadFlow } from "@/hooks/use-upload-flow";
import { MATERIAL_RULES, VIDEO_RULES, titleFromFilename } from "@/lib/file-rules";
import { fileTypeLabel, formatBytes } from "@/lib/files";
import { notify } from "@/lib/notify";

import { useCourseChangeRefresh } from "../../hooks";
import {
  confirmMaterialUpload,
  confirmVideoUpload,
  removeMaterial,
  removeVideo,
  requestMaterialUpload,
  requestVideoUpload,
} from "../media-api";

interface LessonMediaProps {
  courseId: number;
  lesson: Lesson;
}

function useLessonRefresh(courseId: number, lessonId: number) {
  const queryClient = useQueryClient();
  const refreshCourse = useCourseChangeRefresh(courseId);
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: learningKeys.lesson(lessonId) });
    refreshCourse();
  }, [queryClient, refreshCourse, lessonId]);
}

function VideoSection({ courseId, lesson }: LessonMediaProps) {
  const refresh = useLessonRefresh(courseId, lesson.id);
  const confirm = useConfirm();
  const [replacing, setReplacing] = useState(false);

  const request = useCallback((file: File) => requestVideoUpload(lesson.id, file), [lesson.id]);
  const confirmUpload = useCallback(
    (ticket: string) => confirmVideoUpload(lesson.id, ticket),
    [lesson.id],
  );
  const onDone = useCallback(() => {
    setReplacing(false);
    refresh();
    notify.success("Video uploaded. Students can play it now.");
  }, [refresh]);
  const upload = useUploadFlow({ request, confirm: confirmUpload, onDone });

  const remove = useMutation({
    mutationFn: () => removeVideo(lesson.id),
    onSuccess: () => {
      refresh();
      notify.success("Video removed.");
    },
    onError: notify.error,
  });
  const { mutate: removeMutate } = remove;

  async function confirmRemove(): Promise<void> {
    const confirmed = await confirm({
      title: "Remove this video?",
      description: "Students will not be able to watch this lesson until you upload another video.",
      confirmLabel: "Remove video",
      cancelLabel: "Keep video",
      tone: "danger",
    });
    if (confirmed) removeMutate();
  }

  const showDropzone = !lesson.has_video || replacing || upload.state.status !== "idle";

  return (
    <section aria-labelledby="lesson-video-heading">
      <h3 id="lesson-video-heading" className="mb-2 text-small font-semibold text-ink-soft">
        Video
      </h3>
      {lesson.has_video ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-3">
          <Video aria-hidden="true" className="size-5 text-success-ink" />
          <Badge tone="success">Video ready</Badge>
          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setReplacing((current) => !current);
              }}
            >
              {replacing ? "Keep current video" : "Replace video"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                void confirmRemove();
              }}
            >
              Remove video
            </Button>
          </div>
        </div>
      ) : null}
      {showDropzone ? (
        <FileDropzone
          label={lesson.has_video ? "Upload a replacement video" : "Upload a video"}
          rules={VIDEO_RULES}
          state={upload.state}
          onFile={(file) => {
            void upload.start(file);
          }}
          onCancel={upload.cancel}
          onDismissError={upload.reset}
        />
      ) : null}
    </section>
  );
}

function MaterialsSection({ courseId, lesson }: LessonMediaProps) {
  const refresh = useLessonRefresh(courseId, lesson.id);
  const confirm = useConfirm();

  const request = useCallback((file: File) => requestMaterialUpload(lesson.id, file), [lesson.id]);
  const confirmUpload = useCallback(
    (ticket: string, file: File) =>
      confirmMaterialUpload(lesson.id, ticket, titleFromFilename(file.name)),
    [lesson.id],
  );
  const onDone = useCallback(() => {
    refresh();
    notify.success("File added to the lesson.");
  }, [refresh]);
  const upload = useUploadFlow({ request, confirm: confirmUpload, onDone });

  const remove = useMutation({
    mutationFn: (materialId: number) => removeMaterial(materialId),
    onSuccess: () => {
      refresh();
      notify.success("File removed.");
    },
    onError: notify.error,
  });
  const { mutate: removeMutate } = remove;

  async function confirmRemove(id: number, title: string): Promise<void> {
    const confirmed = await confirm({
      title: "Remove this file?",
      description: `${title} will no longer be available to students.`,
      confirmLabel: "Remove file",
      cancelLabel: "Keep file",
      tone: "danger",
    });
    if (confirmed) removeMutate(id);
  }

  return (
    <section aria-labelledby="lesson-materials-heading">
      <h3 id="lesson-materials-heading" className="mb-2 text-small font-semibold text-ink-soft">
        Materials
      </h3>
      {lesson.materials.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-2">
          {lesson.materials.map((material) => (
            <li
              key={material.id}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
            >
              <FileText aria-hidden="true" className="size-5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{material.title}</p>
                <p className="truncate text-small text-muted">
                  {fileTypeLabel(material.content_type, material.original_filename)}
                  {material.size_bytes === null ? "" : ` · ${formatBytes(material.size_bytes)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Remove ${material.title}`}
                disabled={remove.isPending}
                onClick={() => {
                  void confirmRemove(material.id, material.title);
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <FileDropzone
        label="Add a file"
        rules={MATERIAL_RULES}
        state={upload.state}
        onFile={(file) => {
          void upload.start(file);
        }}
        onCancel={upload.cancel}
        onDismissError={upload.reset}
      />
    </section>
  );
}

export function LessonMedia({ courseId, lesson }: LessonMediaProps) {
  return (
    <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6">
      {lesson.lesson_type === "video" ? <VideoSection courseId={courseId} lesson={lesson} /> : null}
      <MaterialsSection courseId={courseId} lesson={lesson} />
    </div>
  );
}
