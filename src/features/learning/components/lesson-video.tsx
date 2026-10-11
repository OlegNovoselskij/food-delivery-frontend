import { VideoOff } from "lucide-react";
import { useRef } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

import { usePlayerShortcuts, useVideoSource } from "../hooks";
import { SEEK_SECONDS } from "../video";

const FRAME_CLASS = "aspect-video w-full overflow-hidden rounded-panel bg-night";

function VideoPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <div
      className={`${FRAME_CLASS} flex flex-col items-center justify-center gap-3 p-6 text-center text-on-night`}
    >
      <VideoOff aria-hidden="true" className="size-10 opacity-70" />
      <p className="text-h3 font-semibold">{title}</p>
      <p className="max-w-sm text-small opacity-80">{text}</p>
    </div>
  );
}

function ShortcutHints() {
  return (
    <p className="mt-3 text-small text-muted">
      Keyboard: <kbd className="rounded border border-line-strong px-1.5">Space</kbd> play or pause,{" "}
      <kbd className="rounded border border-line-strong px-1.5">←</kbd>{" "}
      <kbd className="rounded border border-line-strong px-1.5">→</kbd> skip {SEEK_SECONDS} seconds,{" "}
      <kbd className="rounded border border-line-strong px-1.5">M</kbd> mute
    </p>
  );
}

function PlayableVideo({ lessonId, title }: { lessonId: number; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const source = useVideoSource(lessonId, videoRef);
  usePlayerShortcuts(videoRef, source.src !== null);

  if (source.error) {
    return (
      <ErrorState error={source.error} title="Could not load the video" onRetry={source.retry} />
    );
  }
  if (source.src === null) {
    return (
      <Skeleton
        role="status"
        aria-label="Loading video"
        className={`${FRAME_CLASS} rounded-panel`}
      />
    );
  }

  return (
    <div>
      <video
        ref={videoRef}
        key={lessonId}
        src={source.src}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        className={FRAME_CLASS}
        onError={source.handlers.onError}
        onPause={source.handlers.onPause}
        onLoadedMetadata={source.handlers.onLoadedMetadata}
      />
      <ShortcutHints />
    </div>
  );
}

interface LessonVideoProps {
  lessonId: number;
  title: string;
  hasVideo: boolean;
  isVideoLesson: boolean;
}

export function LessonVideo({ lessonId, title, hasVideo, isVideoLesson }: LessonVideoProps) {
  if (!isVideoLesson) return null;
  if (!hasVideo) {
    return (
      <VideoPlaceholder
        title="No video for this lesson yet"
        text="The teacher has not uploaded the video. Check the overview and materials, or come back later."
      />
    );
  }
  return <PlayableVideo lessonId={lessonId} title={title} />;
}
