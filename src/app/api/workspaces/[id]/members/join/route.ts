import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { addMember } from "~/server/db/member";
import { db } from "~/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { inviteToken } = (await req.json()) as { inviteToken?: string };

    const token = await db.inviteToken.findUnique({
      where: { token: inviteToken },
    });
    if (token?.workspaceId !== id) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
    }

    await addMember(user.id, id, "MEMBER");
    return NextResponse.json({ workspaceId: id }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
