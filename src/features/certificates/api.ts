import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { saveDownload } from "@/api/download";
import { unwrap } from "@/api/unwrap";

export const certificateKeys = {
  all: ["certificates"] as const,
  mine: ["certificates", "mine"] as const,
  verify: (number: string) => ["certificates", "verify", number] as const,
};

export function verifyCertificateQuery(number: string) {
  return queryOptions({
    queryKey: certificateKeys.verify(number),
    queryFn: () =>
      unwrap(api.GET("/api/v1/certificates/verify/{number}", { params: { path: { number } } })),
    retry: false,
  });
}

export function myCertificatesQuery() {
  return queryOptions({
    queryKey: certificateKeys.mine,
    queryFn: () => unwrap(api.GET("/api/v1/certificates/mine")),
    staleTime: 0,
  });
}

export async function downloadCertificatePdf(
  certificateId: number,
  certificateNumber: string,
): Promise<void> {
  const result = await api.GET("/api/v1/certificates/{certificate_id}/pdf", {
    params: { path: { certificate_id: certificateId } },
    parseAs: "blob",
  });
  await saveDownload(result, `${certificateNumber}.pdf`);
}
