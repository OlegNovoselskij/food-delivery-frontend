import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="container-page flex flex-col gap-6 py-10"
    >
      <Skeleton className="h-10 w-2/3 max-w-xl" />
      <Skeleton className="h-5 w-1/2 max-w-md" />
      <div className="grid gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="hidden h-64 rounded-card lg:block" />
      </div>
    </div>
  );
}
