import { redirect } from "next/navigation";
import { db } from "~/lib/db";
import { requireAuth } from "~/server/auth";
import { InviteView } from "./invite-view";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const inviteToken = await db.inviteToken.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!inviteToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Invalid invite link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const user = await requireAuth().catch(() => null);

  if (user) {
    const existing = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: inviteToken.workspaceId,
        },
      },
    });
    if (existing) {
      redirect(`/workspace/${inviteToken.workspaceId}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <InviteView
        token={token}
        workspaceId={inviteToken.workspaceId}
        workspaceName={inviteToken.workspace.name}
        isAuthenticated={!!user}
      />
    </div>
  );
}
