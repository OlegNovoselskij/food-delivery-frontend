import type { Notification, NotificationPage } from "@/api/types";

export function prependNotification(
  page: NotificationPage,
  notification: Notification,
): NotificationPage {
  if (page.items.some((item) => item.id === notification.id)) return page;
  const unreadDelta = notification.is_read ? 0 : 1;
  return {
    ...page,
    items: [notification, ...page.items].slice(0, page.size),
    total: page.total + 1,
    unread_count: page.unread_count + unreadDelta,
  };
}

export function withNotificationRead(
  page: NotificationPage,
  notificationId: number,
): NotificationPage {
  const target = page.items.find((item) => item.id === notificationId);
  if (!target || target.is_read) return page;
  return {
    ...page,
    items: page.items.map((item) =>
      item.id === notificationId ? { ...item, is_read: true } : item,
    ),
    unread_count: Math.max(0, page.unread_count - 1),
  };
}

export function withAllNotificationsRead(page: NotificationPage): NotificationPage {
  return {
    ...page,
    items: page.items.map((item) => (item.is_read ? item : { ...item, is_read: true })),
    unread_count: 0,
  };
}
