export class UploadError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

export interface UploadOptions {
  url: string;
  headers: Record<string, string>;
  file: Blob;
  onProgress: (fraction: number) => void;
  signal?: AbortSignal;
}

const NETWORK_MESSAGE =
  "The upload could not reach the storage. Check your connection and try again.";
const REJECTED_MESSAGE = "The storage rejected the upload link. Start the upload again.";
const FAILED_MESSAGE = "The storage could not save the file. Try again.";
const FORBIDDEN = 403;

export function isCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function uploadFile({
  url,
  headers,
  file,
  onProgress,
  signal,
}: UploadOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    Object.entries(headers).forEach(([name, value]) => {
      request.setRequestHeader(name, value);
    });
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      const message = request.status === FORBIDDEN ? REJECTED_MESSAGE : FAILED_MESSAGE;
      reject(new UploadError(message, request.status));
    };
    request.onerror = () => {
      reject(new UploadError(NETWORK_MESSAGE, 0));
    };
    request.onabort = () => {
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    signal?.addEventListener("abort", () => {
      request.abort();
    });
    if (signal?.aborted === true) {
      request.abort();
      return;
    }
    request.send(file);
  });
}
