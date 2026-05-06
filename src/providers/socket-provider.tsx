"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "~/types/socket";
import { useWorkspaceStore } from "~/store/workspace-store";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: AppSocket | null;
  connected: boolean;
  joinChannel: (channelId: string) => void;
  sendMessage: (payload: {
    content: string;
    channelId: string;
    workspaceId: string;
  }) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  joinChannel: () => undefined,
  sendMessage: () => undefined,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { appendMessage, messages, activeChannelId } = useWorkspaceStore();

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
    const socket: AppSocket = io(socketUrl, {
      withCredentials: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", async () => {
      setConnected(true);

      if (activeChannelId) {
        socket.emit("channel:join", { channelId: activeChannelId });

        const channelMessages = messages[activeChannelId];
        const lastId = channelMessages?.at(-1)?.id;
        if (lastId) {
          try {
            const res = await fetch(
              `/api/channels/${activeChannelId}/messages?after=${lastId}`,
            );
            if (res.ok) {
              const missed = (await res.json()) as Array<{
                id: string;
                content: string;
                userId: string;
                userName: string;
                channelId: string;
                createdAt: string;
              }>;
              missed.forEach((m) => appendMessage(activeChannelId, m));
            }
          } catch {
            // ignore
          }
        }
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (payload) => {
      appendMessage(payload.channelId, payload);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit("channel:join", { channelId });
  }, []);

  const sendMessage = useCallback(
    (payload: { content: string; channelId: string; workspaceId: string }) => {
      socketRef.current?.emit("message:send", payload);
    },
    [],
  );

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, joinChannel, sendMessage }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
