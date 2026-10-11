import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/money";

interface PriceTagProps {
  amount: string;
  className?: string;
}

export function PriceTag({ amount, className }: PriceTagProps) {
  return (
    <span className={cn("text-h3 font-bold tracking-tight text-ink", className)}>
      {formatPrice(amount)}
    </span>
  );
}
