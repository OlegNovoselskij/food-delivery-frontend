import { useState } from "react";

import { cn } from "@/lib/cn";
import { isHttpUrl } from "@/lib/url";

import { coverLabel } from "./cover-label";

type CoverShape = "circle" | "square" | "triangle";

interface CoverPalette {
  base: string;
  large: string;
  small: string;
  shape: CoverShape;
}

const DEFAULT_PALETTE: CoverPalette = {
  base: "bg-art-indigo",
  large: "bg-art-amber",
  small: "bg-art-night",
  shape: "circle",
};

const PALETTES: readonly CoverPalette[] = [
  DEFAULT_PALETTE,
  { base: "bg-art-emerald", large: "bg-art-lilac", small: "bg-art-night", shape: "square" },
  {
    base: "bg-art-night",
    large: "bg-art-periwinkle",
    small: "bg-art-amber",
    shape: "circle",
  },
  { base: "bg-art-rose", large: "bg-art-sun", small: "bg-art-indigo", shape: "square" },
  {
    base: "bg-art-periwinkle",
    large: "bg-art-mist",
    small: "bg-art-emerald",
    shape: "triangle",
  },
  { base: "bg-art-copper", large: "bg-art-night", small: "bg-art-sun", shape: "circle" },
];

const LARGE_SHAPE: Record<CoverShape, string> = {
  circle: "rounded-full",
  square: "rounded-[22%] rotate-[18deg]",
  triangle: "rounded-full",
};

const SMALL_SHAPE: Record<CoverShape, string> = {
  circle: "-bottom-[34%] -left-[8%] w-[46%] rounded-full",
  square: "-bottom-[34%] -left-[8%] w-[46%] rounded-full",
  triangle: "bottom-0 left-[14%] w-[52%] [clip-path:polygon(0_100%,100%_100%,50%_0)]",
};

function coverPalette(courseId: number): CoverPalette {
  return PALETTES[Math.abs(courseId) % PALETTES.length] ?? DEFAULT_PALETTE;
}

interface CourseCoverProps {
  courseId: number;
  title: string;
  coverUrl: string | null;
  className?: string;
  priority?: boolean | undefined;
}

export function CourseCover({ courseId, title, coverUrl, className, priority }: CourseCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (isHttpUrl(coverUrl) && !imageFailed) {
    return (
      <img
        src={coverUrl}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onError={() => {
          setImageFailed(true);
        }}
        className={cn("w-full bg-sunken object-cover", className)}
      />
    );
  }

  const palette = coverPalette(courseId);

  return (
    <div
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden", palette.base, className)}
    >
      <span
        className={cn(
          "absolute -top-[30%] -right-[14%] aspect-square w-[70%]",
          palette.large,
          LARGE_SHAPE[palette.shape],
        )}
      />
      <span className={cn("absolute aspect-square", palette.small, SMALL_SHAPE[palette.shape])} />
      <span className="absolute bottom-3 left-3.5 z-10 rounded-md bg-night px-2 py-0.5 text-small font-bold tracking-tight text-on-night">
        {coverLabel(title)}
      </span>
    </div>
  );
}
