import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { env } from "@/config/env";
import { useAuth } from "@/features/auth";

import { fetchSocketTicket } from "./api";
import { buildSocketUrl, createBrowserSocket } from "./browser-socket";
import { NotificationsContext } from "./context";
import { handleSocketText } from "./live-updates";
import { ReconnectingSocket, type SocketStatus } from "./socket";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SocketStatus>("idle");
  const signedIn = session.status === "authenticated";

  useEffect(() => {
    if (!signedIn) return;
    const socket = new ReconnectingSocket({
      fetchTicket: fetchSocketTicket,
      createSocket: (ticket) => createBrowserSocket(buildSocketUrl(env.apiUrl, ticket)),
      onMessage: (text) => {
        handleSocketText(text, queryClient, (path) => {
          void navigate(path);
        });
      },
      onStatusChange: setStatus,
    });
    socket.start();
    return () => {
      socket.stop();
    };
  }, [signedIn, queryClient, navigate]);

  const value = useMemo(() => ({ status }), [status]);

  return <NotificationsContext value={value}>{children}</NotificationsContext>;
}
