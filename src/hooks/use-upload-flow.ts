import { useCallback, useEffect, useRef, useState } from "react";

import { toApiError } from "@/api/errors";
import { UploadError, isCancelled, uploadFile } from "@/lib/upload";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string; progress: number }
  | { status: "confirming"; fileName: string }
  | { status: "failed"; fileName: string; message: string };

export interface UploadInstructions {
  upload_url: string;
  headers: Record<string, string>;
  upload_ticket: string;
}

interface UploadFlow<TResult> {
  request: (file: File) => Promise<UploadInstructions>;
  confirm: (ticket: string, file: File) => Promise<TResult>;
  onDone: (result: TResult) => void;
}

const IDLE: UploadState = { status: "idle" };

function failureMessage(error: unknown): string {
  return error instanceof UploadError ? error.message : toApiError(error).message;
}

export function useUploadFlow<TResult>(flow: UploadFlow<TResult>) {
  const [state, setState] = useState<UploadState>(IDLE);
  const controller = useRef<AbortController | null>(null);
  const { request, confirm, onDone } = flow;

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const start = useCallback(
    async (file: File): Promise<void> => {
      const current = new AbortController();
      controller.current = current;
      setState({ status: "uploading", fileName: file.name, progress: 0 });
      try {
        const instructions = await request(file);
        await uploadFile({
          url: instructions.upload_url,
          headers: instructions.headers,
          file,
          signal: current.signal,
          onProgress: (progress) => {
            setState({ status: "uploading", fileName: file.name, progress });
          },
        });
        setState({ status: "confirming", fileName: file.name });
        const result = await confirm(instructions.upload_ticket, file);
        setState(IDLE);
        onDone(result);
      } catch (error) {
        if (isCancelled(error)) {
          setState(IDLE);
          return;
        }
        setState({ status: "failed", fileName: file.name, message: failureMessage(error) });
      } finally {
        if (controller.current === current) controller.current = null;
      }
    },
    [request, confirm, onDone],
  );

  const cancel = useCallback(() => {
    controller.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setState(IDLE);
  }, []);

  return { state, start, cancel, reset };
}
