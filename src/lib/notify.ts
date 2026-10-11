import { toast } from "sonner";

import { toApiError } from "@/api/errors";

interface ToastAction {
  label: string;
  onClick: () => void;
}

export const notify = {
  success: (message: string, action?: ToastAction): void => {
    toast.success(message, action ? { action } : undefined);
  },
  info: (title: string, description: string, action?: ToastAction): void => {
    toast(title, { description, ...(action ? { action } : {}) });
  },
  error: (error: unknown): void => {
    toast.error(toApiError(error).message);
  },
};
