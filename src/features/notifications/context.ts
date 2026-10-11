import { createContext } from "react";

import type { SocketStatus } from "./socket";

export interface NotificationsContextValue {
  status: SocketStatus;
}

export const NotificationsContext = createContext<NotificationsContextValue>({ status: "idle" });
