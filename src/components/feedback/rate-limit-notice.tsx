import { formatCountdown } from "@/lib/format";

import { FormError } from "./form-error";

interface RateLimitNoticeProps {
  secondsLeft: number;
}

export function RateLimitNotice({ secondsLeft }: RateLimitNoticeProps) {
  if (secondsLeft <= 0) return null;
  return <FormError message={`Too many attempts. Try again in ${formatCountdown(secondsLeft)}.`} />;
}
