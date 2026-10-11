import type { SocketLike } from "./socket";

export function buildSocketUrl(apiUrl: string, ticket: string): string {
  const url = new URL("/api/v1/ws", apiUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export function createBrowserSocket(url: string): SocketLike {
  const native = new WebSocket(url);
  const adapter: SocketLike = {
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    send: (data) => {
      native.send(data);
    },
    close: () => {
      native.close();
    },
  };
  native.onopen = () => {
    adapter.onopen?.();
  };
  native.onmessage = (event: MessageEvent<unknown>) => {
    adapter.onmessage?.({ data: event.data });
  };
  native.onclose = () => {
    adapter.onclose?.();
  };
  native.onerror = () => {
    adapter.onerror?.();
  };
  return adapter;
}
