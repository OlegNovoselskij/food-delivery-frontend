import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SortableItemProps {
  id: number;
  handleLabel: string;
  className?: string;
  draggingClassName?: string;
  children: (handle: ReactNode) => ReactNode;
}

export function SortableItem({
  id,
  handleLabel,
  className,
  draggingClassName,
  children,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={handleLabel}
      className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-faint hover:bg-sunken hover:text-ink-soft active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && ["relative z-10 shadow-pop", draggingClassName])}
    >
      {children(handle)}
    </li>
  );
}
