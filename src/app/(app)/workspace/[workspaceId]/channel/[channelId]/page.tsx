import { notFound, redirect } from "next/navigation";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember } from "~/server/db/workspace";
import { getChannelById } from "~/server/db/channel";
import { getMessages } from "~/server/db/message";
import { ChannelView } from "./channel-view";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspaceId: string; channelId: string }>;
}) {
  const user = await requireAuth().catch(() => null);
  if (!user) redirect("/sign-in");

  const { workspaceId, channelId } = await params;
  const channel = await getChannelById(channelId);
  if (channel?.workspaceId !== workspaceId) notFound();

  const member = await requireWorkspaceMember(user.id, workspaceId).catch(() => null);
  if (!member) redirect("/");

  const rawMessages = await getMessages({ channelId, take: 50 });
  const initialMessages = rawMessages.map((m) => ({
    id: m.id,
    content: m.content,
    userId: m.userId,
    userName: m.user.name ?? "Unknown",
    channelId: m.channelId,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChannelView
      channel={channel}
      workspaceId={workspaceId}
      initialMessages={initialMessages}
      isAdmin={member.role === "ADMIN"}
      currentUserId={user.id}
    />
  );
}
