import { PathRail } from "@/components/domain/path-rail";
import type { PathModuleView } from "@/components/domain/path-types";
import { ProgressTrack } from "@/components/domain/progress-track";

interface PathSidebarProps {
  modules: readonly PathModuleView[];
  fractions: readonly number[] | null;
  lessonsDone: number | null;
  lessonsTotal: number;
  onNavigate?: () => void;
}

export function PathSidebar({
  modules,
  fractions,
  lessonsDone,
  lessonsTotal,
  onNavigate,
}: PathSidebarProps) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-h3 font-semibold">Your path</h2>
          <p className="text-small text-muted">
            {lessonsDone === null
              ? `${lessonsTotal} lessons`
              : `${lessonsDone} of ${lessonsTotal} lessons`}
          </p>
        </div>
        {fractions ? <ProgressTrack segments={fractions} label="Progress by module" /> : null}
      </div>
      <PathRail modules={modules} {...(onNavigate ? { onNavigate } : {})} />
    </div>
  );
}
