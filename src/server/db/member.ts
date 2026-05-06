import { db } from "~/lib/db";

export async function getMembersByWorkspace(workspaceId: string) {
  return db.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function removeMember(userId: string, workspaceId: string) {
  return db.workspaceMember.delete({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
}

export async function addMember(
  userId: string,
  workspaceId: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
) {
  return db.workspaceMember.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    create: { userId, workspaceId, role },
    update: {},
  });
}
