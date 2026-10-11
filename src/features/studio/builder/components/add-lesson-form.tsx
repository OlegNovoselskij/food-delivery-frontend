import { useId, useState, type SubmitEvent } from "react";

import type { LessonCreate } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TITLE_MAX_LENGTH = 200;
const LESSON_TYPES = [
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
] as const;

type LessonType = (typeof LESSON_TYPES)[number]["value"];

interface AddLessonFormProps {
  pending: boolean;
  onSubmit: (body: LessonCreate) => void;
  onCancel: () => void;
}

export function AddLessonForm({ pending, onSubmit, onCancel }: AddLessonFormProps) {
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("video");
  const trimmed = title.trim();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (trimmed === "" || pending) return;
    onSubmit({ title: trimmed, lesson_type: lessonType, is_preview: false });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
      <div>
        <Label htmlFor={titleId} className="mb-1.5 block">
          Lesson title
        </Label>
        <Input
          id={titleId}
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </div>
      <fieldset>
        <legend className="mb-1.5 text-small font-semibold text-ink-soft">Lesson type</legend>
        <div className="flex gap-4">
          {LESSON_TYPES.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name={`lesson-type-${titleId}`}
                checked={lessonType === option.value}
                onChange={() => {
                  setLessonType(option.value);
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={trimmed === "" || pending}>
          {pending ? "Adding" : "Add lesson"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
