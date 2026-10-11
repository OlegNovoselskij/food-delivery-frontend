import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UploadError } from "@/lib/upload";
import type * as UploadModule from "@/lib/upload";

import { useUploadFlow, type UploadInstructions } from "./use-upload-flow";

const uploadFile = vi.fn();

vi.mock("@/lib/upload", async (importOriginal) => {
  const original = await importOriginal<typeof UploadModule>();
  return { ...original, uploadFile: (options: unknown) => uploadFile(options) as Promise<void> };
});

const instructions: UploadInstructions = {
  upload_url: "http://storage/put",
  headers: { "Content-Type": "video/webm" },
  upload_ticket: "ticket-1",
};

const file = new File(["bytes"], "lesson.webm", { type: "video/webm" });

function setup(overrides: { confirm?: () => Promise<string> } = {}) {
  const onDone = vi.fn();
  const request = vi.fn(() => Promise.resolve(instructions));
  const confirm = vi.fn(overrides.confirm ?? (() => Promise.resolve("saved")));
  const hook = renderHook(() => useUploadFlow({ request, confirm, onDone }));
  return { ...hook, onDone, request, confirm };
}

describe("useUploadFlow", () => {
  beforeEach(() => {
    uploadFile.mockReset();
  });

  it("requests, uploads with progress, confirms and finishes", async () => {
    uploadFile.mockImplementation(({ onProgress }: { onProgress: (fraction: number) => void }) => {
      onProgress(0.5);
      return Promise.resolve();
    });
    const { result, onDone, confirm } = setup();
    await act(async () => {
      await result.current.start(file);
    });
    expect(uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ url: "http://storage/put", headers: instructions.headers, file }),
    );
    expect(confirm).toHaveBeenCalledWith("ticket-1", file);
    expect(onDone).toHaveBeenCalledWith("saved");
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("shows the progress while uploading", async () => {
    let release: () => void = () => undefined;
    uploadFile.mockImplementation(
      ({ onProgress }: { onProgress: (fraction: number) => void }) =>
        new Promise<void>((resolve) => {
          onProgress(0.64);
          release = resolve;
        }),
    );
    const { result } = setup();
    act(() => {
      void result.current.start(file);
    });
    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: "uploading",
        fileName: "lesson.webm",
        progress: 0.64,
      });
    });
    await act(async () => {
      release();
      await Promise.resolve();
    });
  });

  it("reports a storage failure without confirming", async () => {
    uploadFile.mockRejectedValue(new UploadError("The storage could not save the file.", 500));
    const { result, confirm, onDone } = setup();
    await act(async () => {
      await result.current.start(file);
    });
    expect(result.current.state).toEqual({
      status: "failed",
      fileName: "lesson.webm",
      message: "The storage could not save the file.",
    });
    expect(confirm).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("returns to idle when the upload is cancelled", async () => {
    uploadFile.mockRejectedValue(new DOMException("Upload cancelled", "AbortError"));
    const { result } = setup();
    await act(async () => {
      await result.current.start(file);
    });
    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("reports an API failure from the confirm step", async () => {
    uploadFile.mockResolvedValue(undefined);
    const { result } = setup({ confirm: () => Promise.reject(new Error("boom")) });
    await act(async () => {
      await result.current.start(file);
    });
    expect(result.current.state.status).toBe("failed");
  });
});
