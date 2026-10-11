import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { myCertificatesQuery } from "../api";
import { CertificateCard } from "../components/certificate-card";

export function Component() {
  const certificates = useQuery(myCertificatesQuery());

  return (
    <div className="container-page max-w-4xl py-10">
      <title>Certificates · Atrium</title>
      <h1 className="text-h1">Certificates</h1>
      <p className="mt-2 text-muted">
        Share the verification link so anyone can check that a certificate is real.
      </p>

      <div className="mt-8">
        {certificates.isPending ? (
          <div
            role="status"
            aria-label="Loading certificates"
            className="grid gap-5 sm:grid-cols-2"
          >
            <Skeleton className="h-56 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
        ) : null}
        {certificates.isError ? (
          <ErrorState
            error={certificates.error}
            title="Could not load your certificates"
            onRetry={() => {
              void certificates.refetch();
            }}
          />
        ) : null}
        {certificates.data?.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Finish a course to earn one. Every certificate has a number you can verify online."
            action={
              <Button asChild>
                <Link to="/learning">Continue learning</Link>
              </Button>
            }
          />
        ) : null}
        {certificates.data && certificates.data.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2">
            {certificates.data.map((certificate) => (
              <li key={certificate.id} className="flex">
                <div className="w-full">
                  <CertificateCard certificate={certificate} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
