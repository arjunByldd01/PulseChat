import { db } from "~/lib/db";

export async function getChannelsByWorkspace(workspaceId: string) {
  return db.channel.findMany({
    where: { workspaceId },
    select: { id: true, name: true, description: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getChannelById(id: string) {
  return db.channel.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, workspaceId: true },
  });
}

export async function createChannel(
  workspaceId: string,
  name: string,
  description?: string,
) {
  return db.channel.create({
    data: { workspaceId, name, description },
  });
}

export async function deleteChannel(id: string) {
  return db.channel.delete({ where: { id } });
}
