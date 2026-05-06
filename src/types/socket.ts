export interface MessageNewPayload {
  id: string;
  content: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void;
  "member:removed": (payload: { userId: string; workspaceId: string }) => void;
  "member:joined": (payload: {
    userId: string;
    userName: string;
    workspaceId: string;
  }) => void;
}

export interface ClientToServerEvents {
  "message:send": (payload: {
    content: string;
    channelId: string;
    workspaceId: string;
  }) => void;
  "channel:join": (payload: { channelId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: string;
}
