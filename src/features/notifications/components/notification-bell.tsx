import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";

import { DROPDOWN_SIZE, notificationsQuery } from "../api";
import { useMarkAllRead, useUnreadCount } from "../hooks";
import { NotificationItem } from "./notification-item";

const MAX_BADGE_COUNT = 99;
const DROPDOWN_FILTER = { unread: false, page: 1, size: DROPDOWN_SIZE } as const;

function DropdownBody({ onClose }: { onClose: () => void }) {
  const list = useQuery(notificationsQuery(DROPDOWN_FILTER));

  if (list.isPending) {
    return (
      <div role="status" aria-label="Loading notifications" className="flex flex-col gap-3 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  if (list.isError) {
    return (
      <div className="p-4">
        <ErrorState
          error={list.error}
          title="Could not load notifications"
          onRetry={() => {
            void list.refetch();
          }}
        />
      </div>
    );
  }
  if (list.data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted">
        <BellOff aria-hidden="true" className="size-6" />
        <p>No notifications yet. Updates about your courses appear here.</p>
      </div>
    );
  }
  return (
    <ul className="max-h-96 overflow-y-auto">
      {list.data.items.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onOpen={onClose} />
      ))}
    </ul>
  );
}

export function NotificationBell() {
  const { session } = useAuth();
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const [open, setOpen] = useState(false);

  if (session.status !== "authenticated") return null;

  const badge = unread > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(unread);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell aria-hidden="true" className="size-5" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] leading-4 font-bold text-white"
            >
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Notifications">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-h3 font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => {
              markAll.mutate();
            }}
          >
            Mark all as read
          </Button>
        </div>
        <DropdownBody
          onClose={() => {
            setOpen(false);
          }}
        />
        <div className="border-t border-line p-2">
          <Button asChild variant="ghost" className="w-full">
            <Link
              to="/notifications"
              onClick={() => {
                setOpen(false);
              }}
            >
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
