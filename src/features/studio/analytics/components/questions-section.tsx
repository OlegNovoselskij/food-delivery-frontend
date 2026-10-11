import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { MIN_ANSWERS_FOR_DIFFICULTY, exportReportCsv, questionStatsQuery } from "../api";
import { percentText } from "../format";
import { NO_STUDENT_FILTERS } from "../student-filters";
import { ExportButton, ReportSection } from "./report-section";
import { ReportTable, Td, Th } from "./report-table";

const HARD_BELOW_PERCENT = 50;

export function QuestionsSection({ courseId }: { courseId: number }) {
  const questions = useQuery(questionStatsQuery(courseId));
  const rows = questions.data?.items ?? [];

  return (
    <ReportSection
      title="Hardest questions"
      description={`Questions students get wrong most often, from ${MIN_ANSWERS_FOR_DIFFICULTY} or more answers.`}
      state={questions}
      isEmpty={rows.length === 0}
      emptyIcon={Flame}
      emptyTitle="Not enough answers yet"
      emptyDescription={`A question appears here after at least ${MIN_ANSWERS_FOR_DIFFICULTY} students have answered it.`}
      action={
        <ExportButton
          label="Export questions CSV"
          disabled={rows.length === 0}
          run={() => exportReportCsv("questions", courseId, NO_STUDENT_FILTERS)}
        />
      }
    >
      <ReportTable label="Hardest questions">
        <thead>
          <tr>
            <Th>Question</Th>
            <Th>Answered</Th>
            <Th>Correct</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.question_id}>
              <Td className="max-w-md">
                <p className="font-semibold">{row.text}</p>
                <p className="text-small text-muted">{row.quiz_title}</p>
              </Td>
              <Td>{row.answered}</Td>
              <Td>
                <Badge tone={row.correct_percent < HARD_BELOW_PERCENT ? "danger" : "neutral"}>
                  {percentText(row.correct_percent)}
                </Badge>
                <span className="ml-2 text-small text-muted">
                  {row.correct} of {row.answered}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </ReportTable>
    </ReportSection>
  );
}
