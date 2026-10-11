export const COURSE_STATUS = {
  draft: "draft",
  published: "published",
  archived: "archived",
} as const;

export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger" | "amber";

export const COURSE_STATUS_PRESENTATION: Record<string, { label: string; tone: BadgeTone }> = {
  [COURSE_STATUS.draft]: { label: "Draft", tone: "amber" },
  [COURSE_STATUS.published]: { label: "Published", tone: "success" },
  [COURSE_STATUS.archived]: { label: "Archived", tone: "neutral" },
};

export function canPublish(status: string): boolean {
  return status === COURSE_STATUS.draft;
}

export function canArchive(status: string): boolean {
  return status === COURSE_STATUS.published;
}

export function canDelete(status: string): boolean {
  return status === COURSE_STATUS.draft;
}
