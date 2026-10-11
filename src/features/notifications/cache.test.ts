import { describe, expect, it } from "vitest";

import type { Notification, NotificationPage } from "@/api/types";

import { prependNotification, withAllNotificationsRead, withNotificationRead } from "./cache";

function notification(id: number, isRead = false): Notification {
  return {
    id,
    type: "quiz_graded",
    title: `Title ${id}`,
    body: "Body",
    payload: {},
    is_read: isRead,
    created_at: "2026-03-01T10:00:00Z",
  };
}

function page(items: Notification[], unread: number, size = 3): NotificationPage {
  return { items, total: items.length, unread_count: unread, page: 1, size };
}

describe("prependNotification", () => {
  it("puts the new notification first and updates counters", () => {
    const next = prependNotification(page([notification(1)], 1), notification(2));
    expect(next.items.map((item) => item.id)).toEqual([2, 1]);
    expect(next.total).toBe(2);
    expect(next.unread_count).toBe(2);
  });

  it("keeps the page size", () => {
    const next = prependNotification(
      page([notification(1), notification(2), notification(3)], 3),
      notification(4),
    );
    expect(next.items.map((item) => item.id)).toEqual([4, 1, 2]);
  });

  it("ignores a notification that is already listed", () => {
    const original = page([notification(1)], 1);
    expect(prependNotification(original, notification(1))).toBe(original);
  });
});

describe("withNotificationRead", () => {
  it("marks one notification and lowers the unread count", () => {
    const next = withNotificationRead(page([notification(1), notification(2)], 2), 2);
    expect(next.items.map((item) => item.is_read)).toEqual([false, true]);
    expect(next.unread_count).toBe(1);
  });

  it("does nothing for read or unknown notifications", () => {
    const original = page([notification(1, true)], 0);
    expect(withNotificationRead(original, 1)).toBe(original);
    expect(withNotificationRead(original, 9)).toBe(original);
  });
});

describe("withAllNotificationsRead", () => {
  it("marks everything read", () => {
    const next = withAllNotificationsRead(page([notification(1), notification(2)], 2));
    expect(next.items.every((item) => item.is_read)).toBe(true);
    expect(next.unread_count).toBe(0);
  });
});
