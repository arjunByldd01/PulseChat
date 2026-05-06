import { db } from "~/lib/db";

export async function getWorkspacesByUser(userId: string) {
  return db.workspace.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorkspaceById(id: string) {
  return db.workspace.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
}

export async function createWorkspace(name: string, creatorId: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const unique = `${slug}-${Date.now().toString(36)}`;

  return db.workspace.create({
    data: {
      name,
      slug: unique,
      members: {
        create: { userId: creatorId, role: "ADMIN" },
      },
    },
  });
}

export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string,
) {
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member) throw new Error("FORBIDDEN");
  return member;
}
