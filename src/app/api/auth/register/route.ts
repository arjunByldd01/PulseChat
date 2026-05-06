import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "~/lib/db";
import { addMember } from "~/server/db/member";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    name?: string;
    inviteToken?: string;
  };

  const { email, password, name, inviteToken } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password too short", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered", code: "CONFLICT" },
      { status: 409 },
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email, password: hashed, name: name ?? email.split("@")[0] },
  });

  if (inviteToken) {
    const token = await db.inviteToken.findUnique({
      where: { token: inviteToken },
    });
    if (token) {
      await addMember(user.id, token.workspaceId, "MEMBER");
      return NextResponse.json({ workspaceId: token.workspaceId }, { status: 201 });
    }
  }

  return NextResponse.json({ userId: user.id }, { status: 201 });
}
