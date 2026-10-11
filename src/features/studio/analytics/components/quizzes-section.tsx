import { useQuery } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { exportReportCsv, quizStatsQuery } from "../api";
import { percentText } from "../format";
import { NO_STUDENT_FILTERS } from "../student-filters";
import { ExportButton, ReportSection } from "./report-section";
import { ReportTable, Td, Th } from "./report-table";

export function QuizzesSection({ courseId }: { courseId: number }) {
  const quizzes = useQuery(quizStatsQuery(courseId));
  const rows = quizzes.data?.items ?? [];

  return (
    <ReportSection
      title="Quiz results"
      description="Attempts, pass rate and average score for each module quiz."
      state={quizzes}
      isEmpty={rows.length === 0}
      emptyIcon={CircleHelp}
      emptyTitle="No quizzes yet"
      emptyDescription="Add a quiz to a module and its results show up here."
      action={
        <ExportButton
          label="Export quizzes CSV"
          disabled={rows.length === 0}
          run={() => exportReportCsv("quizzes", courseId, NO_STUDENT_FILTERS)}
        />
      }
    >
      <ReportTable label="Quiz results">
        <thead>
          <tr>
            <Th>Quiz</Th>
            <Th>Students</Th>
            <Th>Attempts</Th>
            <Th>Pass rate</Th>
            <Th>Average score</Th>
            <Th>Needs grading</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.quiz_id}>
              <Td>
                <p className="font-semibold">{row.title}</p>
                <p className="text-small text-muted">
                  {row.module_title} · pass at {row.passing_score}%
                </p>
              </Td>
              <Td>{row.students}</Td>
              <Td>{row.attempts}</Td>
              <Td>
                {percentText(row.pass_rate)}
                <span className="ml-1 text-small text-muted">
                  ({row.passed_students} of {row.students})
                </span>
              </Td>
              <Td>{percentText(row.avg_score)}</Td>
              <Td>
                {row.pending_review > 0 ? (
                  <Badge tone="warning">{row.pending_review} waiting</Badge>
                ) : (
                  <span className="text-muted">None</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </ReportTable>
    </ReportSection>
  );
}
