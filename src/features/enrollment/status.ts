export const ENROLLMENT_STATUS = {
  pendingPayment: "pending_payment",
  active: "active",
  completed: "completed",
  cancelled: "cancelled",
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

const ALL_STATUSES: readonly string[] = Object.values(ENROLLMENT_STATUS);

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return ALL_STATUSES.includes(value);
}

export function canLearn(status: string): boolean {
  return status === ENROLLMENT_STATUS.active || status === ENROLLMENT_STATUS.completed;
}

export function canCancel(status: string): boolean {
  return status === ENROLLMENT_STATUS.pendingPayment || status === ENROLLMENT_STATUS.active;
}

export function isOpenEnrollment(status: string): boolean {
  return status !== ENROLLMENT_STATUS.cancelled;
}
