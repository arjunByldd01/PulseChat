import { createServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../src/types/socket.js";
import { authMiddleware } from "./middleware/auth.js";
import { handleChannelJoin } from "./handlers/channel.js";
import { handleMessageSend } from "./handlers/message.js";

const PORT = process.env.SOCKET_PORT ?? 3001;
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: NEXTAUTH_URL,
    credentials: true,
  },
});

async function startServer() {
  try {
    const pubClient = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
    const subClient = pubClient.duplicate();
    pubClient.on("error", () => undefined);
    subClient.on("error", () => undefined);
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  } catch {
    console.warn("Redis unavailable — running without Redis adapter (start Docker to enable scaling)");
  }

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

    socket.on("channel:join", (payload) => {
      void handleChannelJoin(socket, io, payload);
    });

    socket.on("message:send", (payload) => {
      void handleMessageSend(socket, io, payload);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
  });
}

void startServer();
