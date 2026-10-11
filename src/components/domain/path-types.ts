export type PathNodeState = "done" | "current" | "upcoming" | "locked";

export interface PathLessonNode {
  kind: "lesson";
  id: number;
  title: string;
  meta: string;
  state: PathNodeState;
  href: string | null;
}

export interface PathQuizNode {
  kind: "quiz";
  id: number | null;
  title: string;
  meta: string;
  state: PathNodeState;
  href: string | null;
}

export type PathNode = PathLessonNode | PathQuizNode;

export type PathModuleStatus = "done" | "in-progress" | "idle" | "locked";

export interface PathModuleView {
  id: number;
  number: number;
  title: string;
  status: PathModuleStatus;
  summary: string;
  nodes: PathNode[];
}
