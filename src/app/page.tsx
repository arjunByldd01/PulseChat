import { redirect } from "next/navigation";
import { requireAuth } from "~/server/auth";
import { db } from "~/lib/db";

export default async function HomePage() {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    redirect("/sign-in");
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    redirect("/workspace/new");
  }

  redirect(`/workspace/${membership.workspaceId}`);
}
