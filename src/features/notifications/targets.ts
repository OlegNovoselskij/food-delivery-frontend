import type { Notification } from "@/api/types";
import { GRADING_PATH, attemptPath, learnPath } from "@/lib/paths";

function numberField(payload: Notification["payload"], key: string): number | null {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

function stringField(payload: Notification["payload"], key: string): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

const CERTIFICATES_PATH = "/certificates";

export function notificationTarget(notification: Notification): string | null {
  const { payload } = notification;
  const courseId = numberField(payload, "course_id");
  switch (notification.type) {
    case "payment_succeeded":
      return courseId === null ? null : learnPath(courseId);
    case "quiz_graded": {
      const attemptId = numberField(payload, "attempt_id");
      return attemptId === null ? null : attemptPath(attemptId, courseId);
    }
    case "course_completed": {
      const number = stringField(payload, "certificate_number");
      return number === null ? CERTIFICATES_PATH : `/certificates/verify/${number}`;
    }
    case "attempt_pending_review":
      return GRADING_PATH;
    default:
      return null;
  }
}
