import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authToken } from "@/api/auth-token";
import type { Notification, NotificationPage } from "@/api/types";
import { API_URL, buildUser } from "@/test/factories";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

const API = `${API_URL}/api/v1`;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.onclose?.();
  }

  serverOpens(): void {
    this.onopen?.();
  }

  serverSends(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  FakeWebSocket.instances = [];
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: FakeWebSocket });
});

afterEach(() => {
  authToken.clear();
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, value: originalWebSocket });
});

function notification(id: number, overrides: Partial<Notification> = {}): Notification {
  return {
    id,
    type: "quiz_graded",
    title: `Quiz graded ${id}`,
    body: "Your quiz was graded.",
    payload: { attempt_id: 70, course_id: 1 },
    is_read: false,
    created_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

interface Backend {
  items: Notification[];
  unread: number;
  tickets: number;
  markReadCalls: number[];
  markAllCalls: number;
}

function mockBackend(items: Notification[] = [notification(1), notification(2)]): Backend {
  const backend: Backend = {
    items,
    unread: items.filter((item) => !item.is_read).length,
    tickets: 0,
    markReadCalls: [],
    markAllCalls: 0,
  };
  const page = (): NotificationPage => ({
    items: backend.items,
    total: backend.items.length,
    unread_count: backend.unread,
    page: 1,
    size: 10,
  });
  server.use(
    http.get(`${API}/users/me`, () => HttpResponse.json(buildUser({ id: 2 }))),
    http.get(`${API}/courses`, () => HttpResponse.json({ items: [], total: 0, page: 1, size: 12 })),
    http.get(`${API}/categories`, () => HttpResponse.json([])),
    http.get(`${API}/notifications`, () => HttpResponse.json(page())),
    http.get(`${API}/notifications/unread-count`, () =>
      HttpResponse.json({ count: backend.unread }),
    ),
    http.post(`${API}/ws/ticket`, () => {
      backend.tickets += 1;
      return HttpResponse.json({ ticket: `ticket-${backend.tickets}`, expires_in: 60 });
    }),
    http.post(`${API}/notifications/:id/read`, ({ params }) => {
      const id = Number(params.id);
      backend.markReadCalls.push(id);
      backend.items = backend.items.map((item) =>
        item.id === id ? { ...item, is_read: true } : item,
      );
      backend.unread = backend.items.filter((item) => !item.is_read).length;
      return HttpResponse.json(backend.items.find((item) => item.id === id));
    }),
    http.post(`${API}/notifications/read-all`, () => {
      backend.markAllCalls += 1;
      backend.items = backend.items.map((item) => ({ ...item, is_read: true }));
      backend.unread = 0;
      return HttpResponse.json({ updated: 2 });
    }),
  );
  return backend;
}

describe("notification bell", () => {
  it("shows the unread count and lists the latest notifications", async () => {
    mockBackend();
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    const bell = await screen.findByRole("button", { name: "Notifications, 2 unread" });
    await user.click(bell);
    const dropdown = await screen.findByRole("dialog", { name: "Notifications" });
    expect(await within(dropdown).findByText("Quiz graded 1")).toBeInTheDocument();
    expect(within(dropdown).getByRole("link", { name: "View all notifications" })).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  it("marks a notification read and opens its target", async () => {
    const backend = mockBackend();
    const user = userEvent.setup();
    const { router } = renderApp({ path: "/courses", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Notifications, 2 unread" }));
    await user.click(await screen.findByRole("button", { name: /Quiz graded 1/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/learning/attempts/70");
    });
    expect(router.state.location.search).toBe("?course=1");
    expect(backend.markReadCalls).toEqual([1]);
    expect(
      await screen.findByRole("button", { name: "Notifications, 1 unread" }),
    ).toBeInTheDocument();
  });

  it("marks everything read", async () => {
    const backend = mockBackend();
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Notifications, 2 unread" }));
    await user.click(await screen.findByRole("button", { name: "Mark all as read" }));
    expect(await screen.findByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(backend.markAllCalls).toBe(1);
  });

  it("explains an empty list", async () => {
    mockBackend([]);
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    await user.click(await screen.findByRole("button", { name: "Notifications" }));
    expect(await screen.findByText(/No notifications yet/)).toBeInTheDocument();
  });

  it("is not shown to visitors", async () => {
    server.use(
      http.get(`${API}/courses`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 12 }),
      ),
      http.get(`${API}/categories`, () => HttpResponse.json([])),
    );
    renderApp({ path: "/courses" });
    await screen.findByRole("heading", { level: 1, name: /Courses taught/ });
    expect(screen.queryByRole("button", { name: /Notifications/ })).not.toBeInTheDocument();
  });
});

describe("live updates", () => {
  it("connects with a ticket and shows a pushed notification without reloading", async () => {
    const backend = mockBackend([]);
    renderApp({ path: "/courses", token: "t" });
    await waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(1);
    });
    const socket = FakeWebSocket.instances[0];
    if (!socket) throw new Error("No socket");
    expect(socket.url).toBe("ws://localhost:8000/api/v1/ws?ticket=ticket-1");

    const pushed = notification(9, {
      type: "course_completed",
      title: "Course completed",
      body: "Congratulations! Your certificate is ready.",
      payload: { course_id: 1, certificate_number: "CERT-2026-AAAA1111" },
    });
    backend.items = [pushed];
    backend.unread = 1;
    act(() => {
      socket.serverOpens();
      socket.serverSends({ type: "connected" });
      socket.serverSends({ type: "notification", notification: pushed });
    });

    expect(await screen.findByText("Course completed")).toBeInTheDocument();
    expect(screen.getByText("Congratulations! Your certificate is ready.")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Notifications, 1 unread" }),
    ).toBeInTheDocument();
  });

  it("reconnects with a fresh ticket after the connection drops", async () => {
    const backend = mockBackend([]);
    renderApp({ path: "/courses", token: "t" });
    await waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(1);
    });
    act(() => {
      FakeWebSocket.instances[0]?.serverOpens();
      FakeWebSocket.instances[0]?.close();
    });
    await waitFor(
      () => {
        expect(FakeWebSocket.instances).toHaveLength(2);
      },
      { timeout: 4000 },
    );
    expect(backend.tickets).toBe(2);
    expect(FakeWebSocket.instances[1]?.url).toContain("ticket=ticket-2");
  });

  it("closes the socket when the user signs out", async () => {
    mockBackend([]);
    const user = userEvent.setup();
    renderApp({ path: "/courses", token: "t" });
    await waitFor(() => {
      expect(FakeWebSocket.instances).toHaveLength(1);
    });
    await user.click(await screen.findByRole("button", { name: "Open account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    await waitFor(() => {
      expect(FakeWebSocket.instances[0]?.closed).toBe(true);
    });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("falls back to polling the unread count while the socket is down", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const backend = mockBackend([]);
      let polls = 0;
      server.use(
        http.get(`${API}/notifications/unread-count`, () => {
          polls += 1;
          return HttpResponse.json({ count: backend.unread });
        }),
      );
      renderApp({ path: "/courses", token: "t" });
      await waitFor(() => {
        expect(polls).toBeGreaterThanOrEqual(1);
      });
      const before = polls;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(61_000);
      });
      await waitFor(() => {
        expect(polls).toBeGreaterThan(before);
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("notifications page", () => {
  it("lists notifications, filters unread and marks all read", async () => {
    const backend = mockBackend([notification(1), notification(2, { is_read: true })]);
    const user = userEvent.setup();
    renderApp({ path: "/notifications", token: "t" });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Notifications" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Quiz graded 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unread (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    await waitFor(() => {
      expect(backend.markAllCalls).toBe(1);
    });
  });

  it("explains when there is nothing to show", async () => {
    mockBackend([]);
    renderApp({ path: "/notifications", token: "t" });
    expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
  });

  it("asks a visitor to sign in", async () => {
    renderApp({ path: "/notifications" });
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
  });
});
