import { useQuery } from "@tanstack/react-query";
import { BellOff } from "lucide-react";
import { useSearchParams } from "react-router";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { totalPagesFor } from "@/lib/pagination";

import { NOTIFICATIONS_PAGE_SIZE, notificationsQuery } from "../api";
import { NotificationItem } from "../components/notification-item";
import { useMarkAllRead } from "../hooks";

const UNREAD_VALUE = "unread";
const FIRST_PAGE = 1;

function pageHref(unread: boolean, page: number): string {
  const params = new URLSearchParams();
  if (unread) params.set("filter", UNREAD_VALUE);
  if (page !== FIRST_PAGE) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? "/notifications" : `/notifications?${query}`;
}

const tabClass =
  "inline-flex h-9 items-center rounded-full border px-4 text-small font-medium transition-colors";

export function Component() {
  const [params, setParams] = useSearchParams();
  const unreadOnly = params.get("filter") === UNREAD_VALUE;
  const requestedPage = Number(params.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : FIRST_PAGE;
  const list = useQuery(
    notificationsQuery({ unread: unreadOnly, page, size: NOTIFICATIONS_PAGE_SIZE }),
  );
  const markAll = useMarkAllRead();
  const unreadCount = list.data?.unread_count ?? 0;

  return (
    <div className="container-page max-w-3xl py-10">
      <title>Notifications · Atrium</title>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Notifications</h1>
        <Button
          variant="secondary"
          disabled={unreadCount === 0 || markAll.isPending}
          onClick={() => {
            markAll.mutate();
          }}
        >
          Mark all as read
        </Button>
      </div>

      <div role="group" aria-label="Filter" className="mt-6 flex gap-2">
        {[
          { label: "All", unread: false },
          { label: unreadCount > 0 ? `Unread (${unreadCount})` : "Unread", unread: true },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            aria-pressed={unreadOnly === tab.unread}
            onClick={() => {
              setParams(tab.unread ? { filter: UNREAD_VALUE } : {});
            }}
            className={cn(
              tabClass,
              unreadOnly === tab.unread
                ? "border-ink bg-ink text-paper"
                : "border-line bg-surface text-ink-soft hover:bg-sunken",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6" aria-live="polite">
        {list.isPending ? (
          <div role="status" aria-label="Loading notifications" className="flex flex-col gap-3">
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
          </div>
        ) : null}
        {list.isError ? (
          <ErrorState
            error={list.error}
            title="Could not load notifications"
            onRetry={() => {
              void list.refetch();
            }}
          />
        ) : null}
        {list.data?.items.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={unreadOnly ? "Nothing unread" : "No notifications yet"}
            description={
              unreadOnly
                ? "You have read everything. New updates will appear here."
                : "Updates about payments, quizzes and certificates will appear here."
            }
          />
        ) : null}
        {list.data && list.data.items.length > 0 ? (
          <ul className="overflow-hidden rounded-card border border-line bg-surface">
            {list.data.items.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </ul>
        ) : null}
      </div>

      {list.data ? (
        <Pagination
          page={page}
          totalPages={totalPagesFor(list.data.total, NOTIFICATIONS_PAGE_SIZE)}
          hrefFor={(target) => pageHref(unreadOnly, target)}
          className="mt-8"
        />
      ) : null}
    </div>
  );
}
