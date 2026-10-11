import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UploadError, isCancelled, uploadFile } from "./upload";

class FakeXhr {
  static last: FakeXhr | null = null;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  status = 200;
  body: unknown = null;
  aborted = false;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  send(body: unknown): void {
    this.body = body;
  }

  abort(): void {
    this.aborted = true;
    this.onabort?.();
  }

  progress(loaded: number, total: number): void {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent);
  }
}

function current(): FakeXhr {
  if (!FakeXhr.last) throw new Error("No request was made");
  return FakeXhr.last;
}

describe("uploadFile", () => {
  beforeEach(() => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    FakeXhr.last = null;
  });

  const file = new Blob(["video bytes"]);

  it("sends exactly the given headers with PUT and reports progress", async () => {
    const progress: number[] = [];
    const promise = uploadFile({
      url: "http://storage/put",
      headers: { "Content-Type": "video/webm", "x-amz-meta": "1" },
      file,
      onProgress: (fraction) => progress.push(fraction),
    });
    const request = current();
    expect(request.method).toBe("PUT");
    expect(request.url).toBe("http://storage/put");
    expect(request.headers).toEqual({ "Content-Type": "video/webm", "x-amz-meta": "1" });
    expect(request.body).toBe(file);

    request.progress(25, 100);
    request.progress(100, 100);
    request.onload?.();
    await expect(promise).resolves.toBeUndefined();
    expect(progress).toEqual([0.25, 1, 1]);
  });

  it("explains a rejected signature", async () => {
    const promise = uploadFile({ url: "u", headers: {}, file, onProgress: () => undefined });
    current().status = 403;
    current().onload?.();
    await expect(promise).rejects.toMatchObject({
      status: 403,
      message: "The storage rejected the upload link. Start the upload again.",
    });
  });

  it("reports a network or CORS failure", async () => {
    const promise = uploadFile({ url: "u", headers: {}, file, onProgress: () => undefined });
    current().onerror?.();
    const error: unknown = await promise.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(UploadError);
    expect(error).toMatchObject({ status: 0 });
  });

  it("can be cancelled", async () => {
    const controller = new AbortController();
    const promise = uploadFile({
      url: "u",
      headers: {},
      file,
      onProgress: () => undefined,
      signal: controller.signal,
    });
    controller.abort();
    const error: unknown = await promise.catch((caught: unknown) => caught);
    expect(current().aborted).toBe(true);
    expect(isCancelled(error)).toBe(true);
  });
});
