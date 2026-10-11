import { Badge } from "@/components/ui/badge";

import { COURSE_STATUS_PRESENTATION } from "../status";

export function CourseStatusBadge({ status }: { status: string }) {
  const presentation = COURSE_STATUS_PRESENTATION[status] ?? {
    label: status,
    tone: "neutral" as const,
  };
  return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
}
