import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, BadgeX } from "lucide-react";
import { useParams } from "react-router";

import { toApiError } from "@/api/errors";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/dates";

import { verifyCertificateQuery } from "../api";
import { VerifyCertificateForm } from "../components/verify-certificate-form";

const HTTP_NOT_FOUND = 404;

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 text-h3 font-semibold">{value}</dd>
    </div>
  );
}

export function Component() {
  const { number = "" } = useParams();
  const certificate = useQuery(verifyCertificateQuery(number));

  return (
    <div className="container-page max-w-3xl py-10">
      <title>Verify certificate · Atrium</title>
      <h1 className="text-h1">Verify a certificate</h1>
      <p className="mt-2 text-muted">
        Check that a certificate was issued by Atrium and see who earned it.
      </p>

      <div className="mt-8" aria-live="polite">
        {certificate.isPending ? (
          <Skeleton
            role="status"
            aria-label="Checking certificate"
            className="h-56 rounded-panel"
          />
        ) : null}

        {certificate.data ? (
          <section className="rounded-panel border border-success-600 bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-success-50 text-success-ink">
                <BadgeCheck aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h2 className="text-h2">Valid certificate</h2>
                <p className="text-small text-muted">{certificate.data.certificate_number}</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <Detail label="Awarded to" value={certificate.data.student_name} />
              <Detail label="Course" value={certificate.data.course_title} />
              <Detail label="Taught by" value={certificate.data.teacher_name} />
              <Detail label="Issued on" value={formatDate(certificate.data.issued_at)} />
            </dl>
          </section>
        ) : null}

        {certificate.isError && toApiError(certificate.error).status === HTTP_NOT_FOUND ? (
          <section className="rounded-panel border border-danger-600 bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-danger-50 text-danger-ink">
                <BadgeX aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h2 className="text-h2">Certificate not found</h2>
                <p className="text-small text-muted">
                  No certificate matches {number}. Check the number and try again.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {certificate.isError && toApiError(certificate.error).status !== HTTP_NOT_FOUND ? (
          <ErrorState
            error={certificate.error}
            title="Could not check the certificate"
            onRetry={() => {
              void certificate.refetch();
            }}
          />
        ) : null}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="mb-4 text-h3">Check another certificate</h2>
        <VerifyCertificateForm key={number} initialNumber={number} />
      </div>
    </div>
  );
}
