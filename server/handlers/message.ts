import type { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../src/types/socket.js";

const db = new PrismaClient();

export async function handleMessageSend(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  payload: { content: string; channelId: string; workspaceId: string },
) {
  const { content, channelId, workspaceId } = payload;
  const userId = socket.data.userId;
  const userName = socket.data.userName;

  if (!content?.trim()) return;

  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!member) {
    socket.emit("error" as Parameters<typeof socket.emit>[0], { message: "Forbidden" } as never);
    return;
  }

  const message = await db.message.create({
    data: { content: content.trim(), channelId, userId },
    include: { user: { select: { name: true } } },
  });

  const broadcastPayload = {
    id: message.id,
    content: message.content,
    channelId: message.channelId,
    workspaceId,
    userId: message.userId,
    userName: message.user.name ?? userName,
    createdAt: message.createdAt.toISOString(),
  };

  io.to(`channel:${channelId}`).emit("message:new", broadcastPayload);
}
