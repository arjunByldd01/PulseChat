import { db } from "~/lib/db";

export async function getMessages({
  channelId,
  take = 50,
  cursor,
  after,
}: {
  channelId: string;
  take?: number;
  cursor?: string;
  after?: string;
}) {
  if (after) {
    const ref = await db.message.findUnique({ where: { id: after } });
    if (!ref) return [];
    return db.message.findMany({
      where: { channelId, createdAt: { gt: ref.createdAt } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }

  if (cursor) {
    return db.message.findMany({
      where: { channelId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip: 1,
      cursor: { id: cursor },
    });
  }

  const rows = await db.message.findMany({
    where: { channelId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.reverse();
}

export async function createMessage({
  content,
  channelId,
  userId,
}: {
  content: string;
  channelId: string;
  userId: string;
}) {
  return db.message.create({
    data: { content, channelId, userId },
    include: { user: { select: { name: true } } },
  });
}
