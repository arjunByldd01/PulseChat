import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { getWorkspaceById, requireWorkspaceMember } from "~/server/db/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const workspace = await getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
    await requireWorkspaceMember(user.id, id);
    return NextResponse.json(workspace);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
