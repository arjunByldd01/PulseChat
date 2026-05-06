import type { Socket } from "socket.io";
import { decode } from "@auth/core/jwt";

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";

export async function authMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  const cookie = socket.handshake.headers.cookie ?? "";

  const tokenMatch =
    cookie.match(/(?:^|;\s*)authjs\.session-token=([^;]+)/) ??
    cookie.match(/(?:^|;\s*)next-auth\.session-token=([^;]+)/);

  const rawToken = tokenMatch?.[1];

  if (!rawToken) {
    return next(new Error("Unauthorized"));
  }

  try {
    const token = await decode({
      token: decodeURIComponent(rawToken),
      secret: SECRET,
      salt: "authjs.session-token",
    });

    if (!token?.id) {
      return next(new Error("Unauthorized"));
    }

    socket.data.userId = token.id as string;
    socket.data.userName = (token.name as string) ?? (token.email as string) ?? "User";
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}
