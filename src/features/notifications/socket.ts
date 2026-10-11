export type SocketStatus = "idle" | "connecting" | "open" | "closed";

export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  send: (data: string) => void;
  close: () => void;
}

export interface BackoffOptions {
  initialDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export interface ReconnectingSocketOptions {
  fetchTicket: () => Promise<string>;
  createSocket: (ticket: string) => SocketLike;
  onMessage: (text: string) => void;
  onStatusChange: (status: SocketStatus) => void;
  backoff?: BackoffOptions;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  random?: () => number;
}

export const DEFAULT_BACKOFF: BackoffOptions = {
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterRatio: 0.3,
};

const DEFAULT_PING_INTERVAL_MS = 25_000;
const DEFAULT_PONG_TIMEOUT_MS = 10_000;
const PING_MESSAGE = "ping";
const PONG_TYPE = "pong";

export function backoffDelay(attempt: number, options: BackoffOptions, random: number): number {
  const base = Math.min(options.maxDelayMs, options.initialDelayMs * 2 ** attempt);
  const jitter = base * options.jitterRatio * (random * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

export class ReconnectingSocket {
  private readonly options: ReconnectingSocketOptions;
  private socket: SocketLike | null = null;
  private attempt = 0;
  private stopped = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private status: SocketStatus = "idle";

  constructor(options: ReconnectingSocketOptions) {
    this.options = options;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.attempt = 0;
    void this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
    this.setStatus("idle");
  }

  private setStatus(next: SocketStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.options.onStatusChange(next);
  }

  private async connect(): Promise<void> {
    this.setStatus("connecting");
    let ticket: string;
    try {
      ticket = await this.options.fetchTicket();
    } catch {
      this.scheduleReconnect();
      return;
    }
    if (this.stopped) return;

    const socket = this.options.createSocket(ticket);
    this.socket = socket;
    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus("open");
      this.startHeartbeat();
    };
    socket.onmessage = (event) => {
      const text = typeof event.data === "string" ? event.data : "";
      if (this.isPong(text)) {
        this.clearPongTimer();
        return;
      }
      this.options.onMessage(text);
    };
    socket.onerror = () => {
      socket.close();
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.clearTimers();
      this.scheduleReconnect();
    };
  }

  private isPong(text: string): boolean {
    try {
      const parsed: unknown = JSON.parse(text);
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        "type" in parsed &&
        parsed.type === PONG_TYPE
      );
    } catch {
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.setStatus("closed");
    const delay = backoffDelay(
      this.attempt,
      this.options.backoff ?? DEFAULT_BACKOFF,
      (this.options.random ?? Math.random)(),
    );
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    const interval = this.options.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS;
    const timeout = this.options.pongTimeoutMs ?? DEFAULT_PONG_TIMEOUT_MS;
    this.pingTimer = setInterval(() => {
      const socket = this.socket;
      if (socket === null) return;
      socket.send(PING_MESSAGE);
      this.clearPongTimer();
      this.pongTimer = setTimeout(() => {
        socket.close();
      }, timeout);
    }, interval);
  }

  private clearPongTimer(): void {
    if (this.pongTimer !== null) clearTimeout(this.pongTimer);
    this.pongTimer = null;
  }

  private clearTimers(): void {
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    if (this.pingTimer !== null) clearInterval(this.pingTimer);
    this.clearPongTimer();
    this.reconnectTimer = null;
    this.pingTimer = null;
  }
}
