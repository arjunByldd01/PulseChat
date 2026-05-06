import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { getMembersByWorkspace } from "~/server/db/member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireWorkspaceMember(user.id, id);
    const members = await getMembersByWorkspace(id);
    return NextResponse.json(members);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
