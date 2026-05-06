import type { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../src/types/socket.js";

const db = new PrismaClient();

export async function handleChannelJoin(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  _io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  payload: { channelId: string },
) {
  const { channelId } = payload;
  const userId = socket.data.userId;

  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { workspaceId: true },
  });

  if (!channel) {
    socket.emit("error" as Parameters<typeof socket.emit>[0], { message: "Channel not found" } as never);
    return;
  }

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: channel.workspaceId },
    },
  });

  if (!member) {
    socket.emit("error" as Parameters<typeof socket.emit>[0], { message: "Forbidden" } as never);
    return;
  }

  await socket.join(`channel:${channelId}`);
}
