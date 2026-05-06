import { NextResponse } from "next/server";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { getChannelsByWorkspace, createChannel } from "~/server/db/channel";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireWorkspaceMember(user.id, id);
    const channels = await getChannelsByWorkspace(id);
    return NextResponse.json(channels);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireWorkspaceMember(user.id, id);
    const { name, description } = (await req.json()) as {
      name?: string;
      description?: string;
    };
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    try {
      const channel = await createChannel(id, name.trim(), description?.trim());
      return NextResponse.json(channel, { status: 201 });
    } catch (dbErr: unknown) {
      if (
        typeof dbErr === "object" &&
        dbErr !== null &&
        "code" in dbErr &&
        (dbErr as { code: string }).code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Channel name already exists", code: "CONFLICT" },
          { status: 409 },
        );
      }
      throw dbErr;
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
