import { Skeleton } from "@/components/ui/skeleton";

export function CourseSkeleton() {
  return (
    <div role="status" aria-label="Loading course" className="container-page py-10">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-12 w-3/4 max-w-2xl" />
      <Skeleton className="mt-4 h-5 w-2/3 max-w-xl" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
        <Skeleton className="h-96 rounded-panel" />
      </div>
    </div>
  );
}

export function ProgramSkeleton() {
  return (
    <div role="status" aria-label="Loading program" className="flex flex-col gap-4">
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
    </div>
  );
}
