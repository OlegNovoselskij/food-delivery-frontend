import type { QuestionPublic } from "@/api/types";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { TextareaField } from "@/components/ui/textarea";

import { QUESTION_TYPES, toggleOption, withText, type DraftAnswer } from "../answers";

interface QuestionCardProps {
  question: QuestionPublic;
  index: number;
  answer: DraftAnswer | undefined;
  disabled: boolean;
  onChange: (answer: DraftAnswer) => void;
}

function pointsLabel(points: number): string {
  return points === 1 ? "1 point" : `${points} points`;
}

function Choices({ question, answer, disabled, onChange }: Omit<QuestionCardProps, "index">) {
  const selected = answer?.optionIds ?? [];

  if (question.question_type === QUESTION_TYPES.single) {
    const [current] = selected;
    return (
      <RadioGroup
        aria-label={question.text}
        value={current === undefined ? "" : String(current)}
        disabled={disabled}
        onValueChange={(value) => {
          onChange(toggleOption(question, answer, Number(value)));
        }}
      >
        {question.options.map((option) => (
          <RadioCard
            key={option.id}
            id={`q${question.id}-o${option.id}`}
            value={String(option.id)}
            label={option.text}
          />
        ))}
      </RadioGroup>
    );
  }

  return (
    <div role="group" aria-label={question.text} className="grid gap-3">
      {question.options.map((option) => (
        <CheckboxCard
          key={option.id}
          id={`q${question.id}-o${option.id}`}
          label={option.text}
          checked={selected.includes(option.id)}
          disabled={disabled}
          onCheckedChange={() => {
            onChange(toggleOption(question, answer, option.id));
          }}
        />
      ))}
    </div>
  );
}

export function QuestionCard(props: QuestionCardProps) {
  const { question, index, answer, disabled, onChange } = props;
  const isOpenText = question.question_type === QUESTION_TYPES.text;
  const hint = isOpenText
    ? "Write your answer. Your teacher will grade it."
    : question.question_type === QUESTION_TYPES.multiple
      ? "Select all that apply."
      : "Select one answer.";

  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <p className="text-small font-semibold text-muted">
        Question {index + 1} · {pointsLabel(question.points)}
      </p>
      <h2 className="mt-1.5 text-h3 font-semibold">{question.text}</h2>
      <p className="mt-1 mb-4 text-small text-muted">{hint}</p>
      {isOpenText ? (
        <TextareaField
          label="Your answer"
          value={answer?.text ?? ""}
          disabled={disabled}
          onChange={(event) => {
            onChange(withText(answer, event.target.value));
          }}
        />
      ) : (
        <Choices question={question} answer={answer} disabled={disabled} onChange={onChange} />
      )}
    </section>
  );
}
