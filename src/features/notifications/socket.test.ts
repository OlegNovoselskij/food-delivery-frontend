import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReconnectingSocket, backoffDelay, type SocketLike, type SocketStatus } from "./socket";

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(readonly ticket: string) {}

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.onclose?.();
  }

  open(): void {
    this.onopen?.();
  }

  receive(text: string): void {
    this.onmessage?.({ data: text });
  }
}

const BACKOFF = { initialDelayMs: 1000, maxDelayMs: 8000, jitterRatio: 0 };

function setup(overrides: { failTickets?: number } = {}) {
  const sockets: FakeSocket[] = [];
  const messages: string[] = [];
  const statuses: SocketStatus[] = [];
  let tickets = 0;
  let failures = overrides.failTickets ?? 0;
  const socket = new ReconnectingSocket({
    fetchTicket: () => {
      tickets += 1;
      if (failures > 0) {
        failures -= 1;
        return Promise.reject(new Error("ticket failed"));
      }
      return Promise.resolve(`ticket-${tickets}`);
    },
    createSocket: (ticket) => {
      const created = new FakeSocket(ticket);
      sockets.push(created);
      return created;
    },
    onMessage: (text) => messages.push(text),
    onStatusChange: (status) => statuses.push(status),
    backoff: BACKOFF,
    pingIntervalMs: 5000,
    pongTimeoutMs: 2000,
    random: () => 0.5,
  });
  return { socket, sockets, messages, statuses, ticketCount: () => tickets };
}

describe("backoffDelay", () => {
  it("doubles up to the maximum", () => {
    expect([0, 1, 2, 3, 4, 5].map((attempt) => backoffDelay(attempt, BACKOFF, 0.5))).toEqual([
      1000, 2000, 4000, 8000, 8000, 8000,
    ]);
  });

  it("adds jitter in both directions", () => {
    const jittery = { ...BACKOFF, jitterRatio: 0.5 };
    expect(backoffDelay(1, jittery, 0)).toBe(1000);
    expect(backoffDelay(1, jittery, 1)).toBe(3000);
  });
});

describe("ReconnectingSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connects with a ticket, reports its status and forwards messages", async () => {
    const { socket, sockets, messages, statuses } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(1);
    expect(sockets[0]?.ticket).toBe("ticket-1");

    sockets[0]?.open();
    sockets[0]?.receive('{"type":"notification"}');
    expect(statuses).toEqual(["connecting", "open"]);
    expect(messages).toEqual(['{"type":"notification"}']);
  });

  it("reconnects with backoff and a fresh ticket every time", async () => {
    const { socket, sockets, ticketCount } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]?.open();
    sockets[0]?.close();

    await vi.advanceTimersByTimeAsync(999);
    expect(sockets).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(2);
    expect(sockets[1]?.ticket).toBe("ticket-2");

    sockets[1]?.close();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sockets).toHaveLength(3);
    expect(sockets[2]?.ticket).toBe("ticket-3");
    expect(ticketCount()).toBe(3);
  });

  it("resets the backoff after a successful connection", async () => {
    const { socket, sockets } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]?.close();
    await vi.advanceTimersByTimeAsync(1000);
    sockets[1]?.close();
    await vi.advanceTimersByTimeAsync(2000);
    sockets[2]?.open();
    sockets[2]?.close();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(4);
  });

  it("retries when the ticket request fails", async () => {
    const { socket, sockets, statuses } = setup({ failTickets: 2 });
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(0);
    expect(statuses).toContain("closed");
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sockets).toHaveLength(1);
    expect(sockets[0]?.ticket).toBe("ticket-3");
  });

  it("sends pings and reconnects when the server stops answering", async () => {
    const { socket, sockets } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]?.open();

    await vi.advanceTimersByTimeAsync(5000);
    expect(sockets[0]?.sent).toEqual(["ping"]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(sockets[0]?.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(2);
  });

  it("keeps the connection when pongs arrive", async () => {
    const { socket, sockets, messages } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]?.open();
    await vi.advanceTimersByTimeAsync(5000);
    sockets[0]?.receive('{"type":"pong"}');
    await vi.advanceTimersByTimeAsync(2000);
    expect(sockets[0]?.closed).toBe(false);
    expect(messages).toEqual([]);
  });

  it("stops for good: closes the socket and never reconnects", async () => {
    const { socket, sockets, statuses } = setup();
    socket.start();
    await vi.advanceTimersByTimeAsync(0);
    sockets[0]?.open();
    socket.stop();
    expect(sockets[0]?.closed).toBe(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sockets).toHaveLength(1);
    expect(statuses.at(-1)).toBe("idle");
  });

  it("does not open a socket when stopped while waiting for a ticket", async () => {
    const { socket, sockets } = setup();
    socket.start();
    socket.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(0);
  });
});
