import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

interface ExportButtonProps {
  label: string;
  run: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ label, run, disabled = false }: ExportButtonProps) {
  const exporting = useMutation({ mutationFn: run, onError: notify.error });
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled || exporting.isPending}
      onClick={() => {
        exporting.mutate();
      }}
    >
      <Download aria-hidden="true" />
      {exporting.isPending ? "Exporting" : label}
    </Button>
  );
}
