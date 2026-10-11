import { Users } from "lucide-react";

import type { TeacherRow } from "@/api/types";
import { ReportTable, Td, Th } from "@/components/domain/report-table";
import { formatWholeMoney } from "@/lib/money";

function teacherInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function ratingText(rating: number | null): string {
  return rating === null ? "No reviews" : rating.toFixed(1);
}

interface TeacherTableProps {
  rows: readonly TeacherRow[];
  detailed: boolean;
}

export function TeacherTable({ rows, detailed }: TeacherTableProps) {
  return (
    <ReportTable label="Teachers" compact={!detailed}>
      <thead>
        <tr>
          <Th>Teacher</Th>
          <Th className="text-right">Courses</Th>
          <Th className="text-right">Students</Th>
          {detailed ? <Th className="text-right">Completed</Th> : null}
          {detailed ? <Th className="text-right">Rating</Th> : null}
          <Th className="text-right">Revenue</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.teacher_id}>
            <Td>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-small font-semibold text-brand-700"
                >
                  {teacherInitial(row.name) || <Users className="size-4" />}
                </span>
                <span className="font-semibold">{row.name}</span>
              </div>
            </Td>
            <Td className="text-right">{row.courses}</Td>
            <Td className="text-right">{row.students}</Td>
            {detailed ? <Td className="text-right">{row.completed}</Td> : null}
            {detailed ? (
              <Td className="text-right">
                {ratingText(row.rating_avg)}
                {row.reviews_count > 0 ? (
                  <span className="ml-1 text-small text-muted">({row.reviews_count})</span>
                ) : null}
              </Td>
            ) : null}
            <Td className="text-right font-semibold">{formatWholeMoney(row.revenue)}</Td>
          </tr>
        ))}
      </tbody>
    </ReportTable>
  );
}
