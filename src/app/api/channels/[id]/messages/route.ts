import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { getChannelById } from "~/server/db/channel";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { getMessages } from "~/server/db/message";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const channel = await getChannelById(id);
    if (!channel) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
    await requireWorkspaceMember(user.id, channel.workspaceId);

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const after = searchParams.get("after") ?? undefined;
    const take = Math.min(Number(searchParams.get("take") ?? 50), 200);

    const messages = await getMessages({ channelId: id, take, cursor, after });

    const shaped = messages.map((m) => ({
      id: m.id,
      content: m.content,
      userId: m.userId,
      userName: m.user.name ?? "Unknown",
      channelId: m.channelId,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json(shaped);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
