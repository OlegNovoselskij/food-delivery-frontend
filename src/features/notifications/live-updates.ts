import type { QueryClient } from "@tanstack/react-query";

import type { Notification, NotificationPage } from "@/api/types";
import { notify } from "@/lib/notify";

import { notificationKeys, type NotificationFilter } from "./api";
import { prependNotification } from "./cache";
import { parseSocketMessage } from "./messages";
import { notificationTarget } from "./targets";

const FILTER_KEY_INDEX = 2;
const VIEW_LABEL = "View";

function isNotificationFilter(value: unknown): value is NotificationFilter {
  return (
    typeof value === "object" &&
    value !== null &&
    "unread" in value &&
    "page" in value &&
    typeof value.unread === "boolean" &&
    typeof value.page === "number"
  );
}

function isFirstPageOfAll(queryKey: readonly unknown[]): boolean {
  const filter = queryKey[FILTER_KEY_INDEX];
  return isNotificationFilter(filter) && filter.page === 1 && !filter.unread;
}

export function applyIncomingNotification(
  queryClient: QueryClient,
  notification: Notification,
  openTarget: (path: string) => void,
): void {
  if (!notification.is_read) {
    queryClient.setQueryData<{ count: number }>(notificationKeys.unread, (current) => ({
      count: (current?.count ?? 0) + 1,
    }));
  }
  queryClient.setQueriesData<NotificationPage>(
    { queryKey: notificationKeys.lists, predicate: (query) => isFirstPageOfAll(query.queryKey) },
    (page) => (page ? prependNotification(page, notification) : page),
  );
  void queryClient.invalidateQueries({
    queryKey: notificationKeys.lists,
    predicate: (query) => !isFirstPageOfAll(query.queryKey),
  });

  const target = notificationTarget(notification);
  notify.info(
    notification.title,
    notification.body,
    target === null
      ? undefined
      : {
          label: VIEW_LABEL,
          onClick: () => {
            openTarget(target);
          },
        },
  );
}

export function handleSocketText(
  text: string,
  queryClient: QueryClient,
  openTarget: (path: string) => void,
): void {
  const message = parseSocketMessage(text);
  if (message === null) return;
  if (message.type === "notification") {
    applyIncomingNotification(queryClient, message.notification, openTarget);
  } else if (message.type === "connected") {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }
}
