import { Check, Lock } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import type { PathModuleStatus, PathModuleView, PathNode, PathNodeState } from "./path-types";

const STATE_LABELS: Record<PathNodeState, string> = {
  done: "Completed",
  current: "Current lesson",
  upcoming: "Not started",
  locked: "Locked",
};

const NODE_BASE = "relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center border-2";

function NodeMark({ node }: { node: PathNode }) {
  const diamond = node.kind === "quiz" ? "rotate-45 rounded-[5px]" : "rounded-full";
  const content = (state: PathNodeState) => {
    switch (state) {
      case "done":
        return (
          <Check
            aria-hidden="true"
            className={cn("size-3 text-on-brand", node.kind === "quiz" && "-rotate-45")}
          />
        );
      case "current":
        return <span className="size-2 rounded-full bg-brand-600" />;
      case "locked":
        return (
          <Lock
            aria-hidden="true"
            className={cn("size-2.5 text-faint", node.kind === "quiz" && "-rotate-45")}
          />
        );
      case "upcoming":
        return null;
    }
  };
  const stateClass: Record<PathNodeState, string> = {
    done: "border-brand-600 bg-brand-600",
    current: "border-brand-600 bg-surface shadow-[0_0_0_4px_var(--color-brand-100)]",
    upcoming: "border-line-strong bg-surface",
    locked: "border-line bg-sunken",
  };
  return (
    <span aria-hidden="true" className={cn(NODE_BASE, diamond, stateClass[node.state])}>
      {content(node.state)}
    </span>
  );
}

function NodeText({ node }: { node: PathNode }) {
  const muted = node.state === "locked";
  return (
    <span className="min-w-0 flex-1 pb-5">
      <span
        className={cn(
          "block leading-snug",
          node.state === "current"
            ? "font-semibold text-ink"
            : muted
              ? "text-faint"
              : "text-ink-soft",
        )}
      >
        {node.title}
        <span className="sr-only">. {STATE_LABELS[node.state]}</span>
      </span>
      {node.meta ? (
        <span className={cn("block text-small", muted ? "text-faint" : "text-muted")}>
          {node.meta}
        </span>
      ) : null}
    </span>
  );
}

function PathRow({
  node,
  isLast,
  onNavigate,
}: {
  node: PathNode;
  isLast: boolean;
  onNavigate: (() => void) | undefined;
}) {
  const body = (
    <>
      <NodeMark node={node} />
      <NodeText node={node} />
    </>
  );
  return (
    <li className="relative">
      {!isLast ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-6 bottom-0 left-[9px] w-0.5",
            node.state === "done" ? "bg-brand-600" : "bg-line-strong",
          )}
        />
      ) : null}
      {node.href !== null ? (
        <Link
          to={node.href}
          aria-current={node.state === "current" ? "step" : undefined}
          onClick={onNavigate}
          className="flex gap-3 rounded-control hover:bg-sunken/60"
        >
          {body}
        </Link>
      ) : (
        <div className="flex gap-3">{body}</div>
      )}
    </li>
  );
}

function moduleBadge(status: PathModuleStatus, summary: string) {
  switch (status) {
    case "done":
      return <Badge tone="success">Done</Badge>;
    case "locked":
      return <Badge tone="neutral">Locked</Badge>;
    case "in-progress":
    case "idle":
      return <span className="text-small font-semibold text-muted">{summary}</span>;
  }
}

interface PathRailProps {
  modules: readonly PathModuleView[];
  onNavigate?: () => void;
}

export function PathRail({ modules, onNavigate }: PathRailProps) {
  return (
    <ol className="flex flex-col gap-7">
      {modules.map((module) => (
        <li key={module.id}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold">
              <span className="mr-1.5">{module.number}</span>
              {module.title}
            </h3>
            {moduleBadge(module.status, module.summary)}
          </div>
          <ul>
            {module.nodes.map((node, index) => (
              <PathRow
                key={`${node.kind}-${node.id ?? "none"}-${index}`}
                node={node}
                isLast={index === module.nodes.length - 1}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
