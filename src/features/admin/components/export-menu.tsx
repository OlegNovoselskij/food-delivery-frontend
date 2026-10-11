import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/lib/notify";

import {
  ADMIN_REPORTS,
  DEFAULT_EXPORT_OPTIONS,
  exportAdminCsv,
  type AdminReport,
  type ExportOptions,
} from "../api";
import type { Period } from "../range";

interface ExportMenuProps {
  period: Period;
  options?: Partial<ExportOptions>;
}

export function ExportMenu({ period, options }: ExportMenuProps) {
  const exporting = useMutation({
    mutationFn: (report: AdminReport) =>
      exportAdminCsv(report, period, { ...DEFAULT_EXPORT_OPTIONS, ...options }),
    onError: notify.error,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" disabled={exporting.isPending}>
          <Download aria-hidden="true" />
          {exporting.isPending ? "Exporting" : "Export CSV"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>For the selected period</DropdownMenuLabel>
        {ADMIN_REPORTS.map((report) => (
          <DropdownMenuItem
            key={report.value}
            onSelect={() => {
              exporting.mutate(report.value);
            }}
          >
            {report.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
