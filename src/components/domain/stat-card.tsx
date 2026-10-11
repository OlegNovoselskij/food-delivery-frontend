import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string | undefined;
  footnote?: string | undefined;
  className?: string;
}

export function StatCard({ label, value, trend, footnote, className }: StatCardProps) {
  return (
    <div className={cn("rounded-card border border-line bg-surface p-5", className)}>
      <p className="text-small text-muted">{label}</p>
      <p className="mt-2 text-[2rem] leading-none font-bold tracking-tight">{value}</p>
      {trend ? <p className="mt-2 text-small font-semibold text-success-ink">{trend}</p> : null}
      {footnote ? <p className="mt-2 text-small text-muted">{footnote}</p> : null}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
