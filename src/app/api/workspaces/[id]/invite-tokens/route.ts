import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { db } from "~/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const member = await requireWorkspaceMember(user.id, id);
    if (member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    const tokens = await db.inviteToken.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return NextResponse.json(tokens);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const member = await requireWorkspaceMember(user.id, id);
    if (member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    const token = await db.inviteToken.create({
      data: { workspaceId: id },
    });
    return NextResponse.json(token, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
