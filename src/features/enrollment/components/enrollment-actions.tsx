import { useState } from "react";
import { Link } from "react-router";

import type { Enrollment } from "@/api/types";
import { Button } from "@/components/ui/button";

import { useCancelEnrollment } from "../hooks";
import { ENROLLMENT_STATUS, canCancel } from "../status";
import { PaymentDialog } from "./payment-dialog";

interface EnrollmentActionsProps {
  enrollment: Enrollment;
  certificateNumber?: string | undefined;
}

export function EnrollmentActions({ enrollment, certificateNumber }: EnrollmentActionsProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { cancel, isPending } = useCancelEnrollment();
  const courseHref = `/courses/${enrollment.course.id}`;
  const learnHref = `/learning/courses/${enrollment.course.id}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enrollment.status === ENROLLMENT_STATUS.pendingPayment ? (
        <>
          <Button
            size="sm"
            onClick={() => {
              setPaymentOpen(true);
            }}
          >
            Pay now
          </Button>
          <PaymentDialog
            enrollmentId={enrollment.id}
            course={enrollment.course}
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
          />
        </>
      ) : null}
      {enrollment.status === ENROLLMENT_STATUS.active ? (
        <Button asChild size="sm">
          <Link to={learnHref}>Continue</Link>
        </Button>
      ) : null}
      {enrollment.status === ENROLLMENT_STATUS.completed ? (
        <>
          {certificateNumber ? (
            <Button asChild size="sm">
              <Link to={`/certificates/verify/${certificateNumber}`}>View certificate</Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary" size="sm">
            <Link to={learnHref}>Review course</Link>
          </Button>
        </>
      ) : null}
      {enrollment.status === ENROLLMENT_STATUS.cancelled ? (
        <Button asChild variant="secondary" size="sm">
          <Link to={courseHref}>Enroll again</Link>
        </Button>
      ) : null}
      {canCancel(enrollment.status) ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            void cancel(enrollment);
          }}
        >
          Cancel enrollment
        </Button>
      ) : null}
    </div>
  );
}
