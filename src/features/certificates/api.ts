import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
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
