import { useMutation } from "@tanstack/react-query";
import { Award, Copy, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router";

import type { Certificate } from "@/api/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { notify } from "@/lib/notify";

import { downloadCertificatePdf } from "../api";

function verificationUrl(number: string): string {
  return new URL(`/certificates/verify/${number}`, window.location.origin).toString();
}

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const download = useMutation({
    mutationFn: () => downloadCertificatePdf(certificate.id, certificate.certificate_number),
    onSuccess: () => {
      notify.success("Certificate downloaded.");
    },
    onError: notify.error,
  });

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(verificationUrl(certificate.certificate_number));
      notify.success("Verification link copied.");
    } catch (error) {
      notify.error(error);
    }
  }

  return (
    <article className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-amber-50 text-warning-ink">
          <Award aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-h3 font-semibold">{certificate.course_title}</h2>
          <p className="text-small text-muted">{certificate.certificate_number}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-small">
        <div>
          <dt className="text-muted">Issued on</dt>
          <dd className="mt-0.5 font-semibold">{formatDate(certificate.issued_at)}</dd>
        </div>
        <div>
          <dt className="text-muted">Taught by</dt>
          <dd className="mt-0.5 font-semibold">{certificate.teacher_name}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={download.isPending}
          onClick={() => {
            download.mutate();
          }}
        >
          <Download aria-hidden="true" />
          {download.isPending ? "Preparing PDF" : "Download PDF"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void copyLink();
          }}
        >
          <Copy aria-hidden="true" />
          Copy verification link
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/certificates/verify/${certificate.certificate_number}`}>
            <ExternalLink aria-hidden="true" />
            Open verification page
          </Link>
        </Button>
      </div>
    </article>
  );
}
