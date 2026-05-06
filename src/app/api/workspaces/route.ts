import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { getWorkspacesByUser, createWorkspace } from "~/server/db/workspace";

export async function GET() {
  try {
    const user = await requireAuth();
    const workspaces = await getWorkspacesByUser(user.id);
    return NextResponse.json(workspaces);
  } catch {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { name } = (await req.json()) as { name?: string };
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const workspace = await createWorkspace(name.trim(), user.id);
    return NextResponse.json(workspace, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
