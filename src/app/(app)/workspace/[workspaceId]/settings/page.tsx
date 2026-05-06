import { redirect } from "next/navigation";
import { requireAuth } from "~/server/auth";
import { requireWorkspaceMember, getWorkspaceById } from "~/server/db/workspace";
import { getChannelsByWorkspace } from "~/server/db/channel";
import { getMembersByWorkspace } from "~/server/db/member";
import { db } from "~/lib/db";
import { SettingsView } from "./settings-view";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await requireAuth().catch(() => null);
  if (!user) redirect("/sign-in");

  const { workspaceId } = await params;
  const member = await requireWorkspaceMember(user.id, workspaceId).catch(() => null);
  if (!member) redirect("/");

  const [workspace, channels, members, inviteTokens] = await Promise.all([
    getWorkspaceById(workspaceId),
    getChannelsByWorkspace(workspaceId),
    getMembersByWorkspace(workspaceId),
    member.role === "ADMIN"
      ? db.inviteToken.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 1,
        })
      : Promise.resolve([]),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <SettingsView
      workspaceId={workspaceId}
      workspaceName={workspace?.name ?? ""}
      channels={channels}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        name: m.user.name ?? m.user.email,
        email: m.user.email,
      }))}
      isAdmin={member.role === "ADMIN"}
      currentUserId={user.id}
      existingToken={inviteTokens[0]?.token ?? null}
      baseUrl={baseUrl}
    />
  );
}
