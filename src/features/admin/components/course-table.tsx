import { Link } from "react-router";

import type { CourseStatRow } from "@/api/types";
import { ReportTable, Td, Th } from "@/components/domain/report-table";
import { CourseStatusBadge } from "@/features/studio";
import { formatWholeMoney } from "@/lib/money";

import { ratingText } from "./teacher-table";

interface CourseTableProps {
  rows: readonly CourseStatRow[];
  detailed: boolean;
}

export function CourseTable({ rows, detailed }: CourseTableProps) {
  return (
    <ReportTable label="Courses" compact={!detailed}>
      <thead>
        <tr>
          <Th>Course</Th>
          {detailed ? <Th>Status</Th> : null}
          {detailed ? <Th>Teacher</Th> : null}
          <Th className="text-right">Enrollments</Th>
          <Th className="text-right">Completion</Th>
          <Th className="text-right">Rating</Th>
          {detailed ? <Th className="text-right">Revenue</Th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.course_id}>
            <Td>
              <Link to={`/courses/${row.course_id}`} className="font-semibold hover:underline">
                {row.title}
              </Link>
              <p className="text-small text-muted">{row.category}</p>
            </Td>
            {detailed ? (
              <Td>
                <CourseStatusBadge status={row.status} />
              </Td>
            ) : null}
            {detailed ? <Td>{row.teacher_name}</Td> : null}
            <Td className="text-right">{row.students}</Td>
            <Td className="text-right">
              {row.completion_rate === null ? "No data" : `${Math.round(row.completion_rate)}%`}
            </Td>
            <Td className="text-right">{ratingText(row.rating_avg)}</Td>
            {detailed ? (
              <Td className="text-right font-semibold">{formatWholeMoney(row.revenue)}</Td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </ReportTable>
  );
}
