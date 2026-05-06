import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { removeMember } from "~/server/db/member";
import { db } from "~/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id, userId } = await params;
    const member = await requireWorkspaceMember(user.id, id);
    if (member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    if (user.id === userId) {
      return NextResponse.json(
        { error: "Cannot remove yourself", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const target = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    if (!target) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
    await removeMember(userId, id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
