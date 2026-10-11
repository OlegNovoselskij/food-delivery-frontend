import { useNavigate } from "react-router";

import type { Notification } from "@/api/types";
import { formatRelative } from "@/lib/dates";

import { useMarkRead } from "../hooks";
import { notificationTarget } from "../targets";

interface NotificationItemProps {
  notification: Notification;
  onOpen?: () => void;
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const navigate = useNavigate();
  const markRead = useMarkRead();
  const target = notificationTarget(notification);

  function open(): void {
    if (!notification.is_read) markRead.mutate(notification.id);
    if (target !== null) void navigate(target);
    onOpen?.();
  }

  return (
    <li className="border-t border-line first:border-t-0">
      <button
        type="button"
        onClick={open}
        className="flex w-full items-start gap-3 rounded-none p-4 text-left hover:bg-sunken/60"
      >
        <span
          aria-hidden="true"
          className={
            notification.is_read
              ? "mt-1.5 size-2.5 shrink-0 rounded-full bg-transparent"
              : "mt-1.5 size-2.5 shrink-0 rounded-full bg-danger-600"
          }
        />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            {notification.is_read ? null : <span className="sr-only">Unread. </span>}
            {notification.title}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-small text-ink-soft">
            {notification.body}
          </span>
          <time dateTime={notification.created_at} className="mt-1 block text-micro text-muted">
            {formatRelative(notification.created_at)}
          </time>
        </span>
      </button>
    </li>
  );
}
