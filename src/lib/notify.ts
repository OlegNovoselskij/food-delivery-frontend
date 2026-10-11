import { toast } from "sonner";

import { toApiError } from "@/api/errors";

export const notify = {
  success: (message: string): void => {
    toast.success(message);
  },
  error: (error: unknown): void => {
    toast.error(toApiError(error).message);
  },
};
