import { Badge } from "@/components/ui/badge";

import { ENROLLMENT_STATUS } from "../status";

type BadgeTone = "brand" | "neutral" | "success" | "warning" | "danger" | "amber";

interface StatusPresentation {
  label: string;
  tone: BadgeTone;
}

const PRESENTATION: Record<string, StatusPresentation> = {
  [ENROLLMENT_STATUS.pendingPayment]: { label: "Awaiting payment", tone: "warning" },
  [ENROLLMENT_STATUS.active]: { label: "In progress", tone: "brand" },
  [ENROLLMENT_STATUS.completed]: { label: "Completed", tone: "success" },
  [ENROLLMENT_STATUS.cancelled]: { label: "Cancelled", tone: "neutral" },
};

const UNKNOWN_PRESENTATION: StatusPresentation = { label: "Unknown status", tone: "neutral" };

export function EnrollmentStatusBadge({ status }: { status: string }) {
  const { label, tone } = PRESENTATION[status] ?? UNKNOWN_PRESENTATION;
  return <Badge tone={tone}>{label}</Badge>;
}
