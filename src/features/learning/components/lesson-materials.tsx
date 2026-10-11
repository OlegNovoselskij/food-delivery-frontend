import { Download, FileText, Paperclip } from "lucide-react";

import type { Material } from "@/api/types";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { fileTypeLabel, formatBytes } from "@/lib/files";

import { useDownloadMaterial } from "../hooks";

export function LessonMaterials({ materials }: { materials: readonly Material[] }) {
  const download = useDownloadMaterial();

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={Paperclip}
        title="No materials for this lesson"
        description="Files the teacher attaches to this lesson will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {materials.map((material) => (
        <li
          key={material.id}
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-4"
        >
          <FileText aria-hidden="true" className="size-5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{material.title}</p>
            <p className="truncate text-small text-muted">
              {fileTypeLabel(material.content_type, material.original_filename)}
              {material.size_bytes === null ? "" : ` · ${formatBytes(material.size_bytes)}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${material.title}`}
            disabled={download.isPending && download.variables === material.id}
            onClick={() => {
              download.mutate(material.id);
            }}
          >
            <Download aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
