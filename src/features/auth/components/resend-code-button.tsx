import { formatCountdown } from "@/lib/format";

interface ResendCodeButtonProps {
  secondsLeft: number;
  pending: boolean;
  onResend: () => void;
}

export function ResendCodeButton({ secondsLeft, pending, onResend }: ResendCodeButtonProps) {
  const waiting = secondsLeft > 0;
  return (
    <p className="text-small text-muted">
      Did not get it?{" "}
      <button
        type="button"
        onClick={onResend}
        disabled={waiting || pending}
        className="rounded-sm font-semibold text-brand-700 hover:underline disabled:no-underline"
      >
        {waiting ? `Send again in ${formatCountdown(secondsLeft)}` : "Send again"}
      </button>
    </p>
  );
}
