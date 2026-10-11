import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";

const ASYNC_UTIL_TIMEOUT_MS = 5000;

class InertWebSocket {
  onopen: (() => void) | null = null;
  onmessage: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send(): void {
    return;
  }
  close(): void {
    return;
  }
}

beforeAll(() => {
  configure({ asyncUtilTimeout: ASYNC_UTIL_TIMEOUT_MS });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  window.ResizeObserver = class {
    observe = (): void => undefined;
    unobserve = (): void => undefined;
    disconnect = (): void => undefined;
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = (): void => undefined;
  Element.prototype.releasePointerCapture = (): void => undefined;
  Element.prototype.scrollIntoView = (): void => undefined;
  Object.defineProperty(window, "scrollTo", { writable: true, value: () => undefined });
  server.listen({ onUnhandledRequest: "error" });
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: InertWebSocket });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();
});

afterAll(() => {
  server.close();
});
