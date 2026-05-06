import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { getChannelById, deleteChannel } from "~/server/db/channel";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; channelId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id, channelId } = await params;
    const member = await requireWorkspaceMember(user.id, id);
    if (member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    const channel = await getChannelById(channelId);
    if (channel?.workspaceId !== id) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
    await deleteChannel(channelId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
