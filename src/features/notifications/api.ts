import { queryOptions } from "@tanstack/react-query";

import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";

export const NOTIFICATIONS_PAGE_SIZE = 20;
export const DROPDOWN_SIZE = 10;

export interface NotificationFilter {
  unread: boolean;
  page: number;
  size: number;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: ["notifications", "list"] as const,
  list: (filter: NotificationFilter) => ["notifications", "list", filter] as const,
  unread: ["notifications", "unread-count"] as const,
};

export function notificationsQuery(filter: NotificationFilter) {
  return queryOptions({
    queryKey: notificationKeys.list(filter),
    queryFn: () => unwrap(api.GET("/api/v1/notifications", { params: { query: filter } })),
    staleTime: 0,
  });
}

export function unreadCountQuery(refetchIntervalMs: number | false) {
  return queryOptions({
    queryKey: notificationKeys.unread,
    queryFn: () => unwrap(api.GET("/api/v1/notifications/unread-count")),
    staleTime: 0,
    refetchInterval: refetchIntervalMs,
  });
}

export async function fetchSocketTicket(): Promise<string> {
  const { ticket } = await unwrap(api.POST("/api/v1/ws/ticket"));
  return ticket;
}

export function markNotificationRead(notificationId: number) {
  return unwrap(
    api.POST("/api/v1/notifications/{notification_id}/read", {
      params: { path: { notification_id: notificationId } },
    }),
  );
}

export function markAllNotificationsRead() {
  return unwrap(api.POST("/api/v1/notifications/read-all"));
}
