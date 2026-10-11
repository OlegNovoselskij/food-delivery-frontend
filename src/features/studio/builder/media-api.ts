import { api } from "@/api/client";
import { unwrap, unwrapEmpty } from "@/api/unwrap";
import type { UploadInstructions } from "@/hooks/use-upload-flow";
import { contentTypeOf } from "@/lib/file-rules";

function uploadBody(file: File) {
  return { filename: file.name, content_type: contentTypeOf(file), size: file.size };
}

export function requestVideoUpload(lessonId: number, file: File): Promise<UploadInstructions> {
  return unwrap(
    api.POST("/api/v1/lessons/{lesson_id}/video/upload-url", {
      params: { path: { lesson_id: lessonId } },
      body: uploadBody(file),
    }),
  );
}

export function confirmVideoUpload(lessonId: number, uploadTicket: string) {
  return unwrap(
    api.POST("/api/v1/lessons/{lesson_id}/video/confirm", {
      params: { path: { lesson_id: lessonId } },
      body: { upload_ticket: uploadTicket },
    }),
  );
}

export function removeVideo(lessonId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/lessons/{lesson_id}/video", { params: { path: { lesson_id: lessonId } } }),
  );
}

export function requestMaterialUpload(lessonId: number, file: File): Promise<UploadInstructions> {
  return unwrap(
    api.POST("/api/v1/lessons/{lesson_id}/materials/upload-url", {
      params: { path: { lesson_id: lessonId } },
      body: uploadBody(file),
    }),
  );
}

export function confirmMaterialUpload(lessonId: number, uploadTicket: string, title: string) {
  return unwrap(
    api.POST("/api/v1/lessons/{lesson_id}/materials/confirm", {
      params: { path: { lesson_id: lessonId } },
      body: { upload_ticket: uploadTicket, title },
    }),
  );
}

export function removeMaterial(materialId: number) {
  return unwrapEmpty(
    api.DELETE("/api/v1/materials/{material_id}", {
      params: { path: { material_id: materialId } },
    }),
  );
}
