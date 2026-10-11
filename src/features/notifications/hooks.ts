import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";

import type { NotificationPage } from "@/api/types";
import { useAuth } from "@/features/auth";
import { notify } from "@/lib/notify";

import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  unreadCountQuery,
} from "./api";
import { withAllNotificationsRead, withNotificationRead } from "./cache";
import { NotificationsContext } from "./context";

const POLL_INTERVAL_MS = 60_000;

function useSocketStatus() {
  return useContext(NotificationsContext).status;
}

export function useUnreadCount(): number {
  const { session } = useAuth();
  const status = useSocketStatus();
  const query = useQuery({
    ...unreadCountQuery(status === "open" ? false : POLL_INTERVAL_MS),
    enabled: session.status === "authenticated",
  });
  return query.data?.count ?? 0;
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      queryClient.setQueriesData<NotificationPage>({ queryKey: notificationKeys.lists }, (page) =>
        page ? withNotificationRead(page, notificationId) : page,
      );
      queryClient.setQueryData<{ count: number }>(notificationKeys.unread, (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current,
      );
    },
    onError: (error) => {
      notify.error(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueriesData<NotificationPage>({ queryKey: notificationKeys.lists }, (page) =>
        page ? withAllNotificationsRead(page) : page,
      );
      queryClient.setQueryData(notificationKeys.unread, { count: 0 });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      notify.success("All notifications marked as read.");
    },
    onError: (error) => {
      notify.error(error);
    },
  });
}
