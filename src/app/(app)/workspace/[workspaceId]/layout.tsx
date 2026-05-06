import { notFound, redirect } from "next/navigation";
import { requireAuth } from "~/server/auth";
import { getWorkspaceById, requireWorkspaceMember, getWorkspacesByUser } from "~/server/db/workspace";
import { getChannelsByWorkspace } from "~/server/db/channel";
import { Sidebar } from "~/components/sidebar";
import { SearchBarClient } from "~/components/search-bar-client";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await requireAuth().catch(() => null);
  if (!user) redirect("/sign-in");

  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) notFound();

  const member = await requireWorkspaceMember(user.id, workspaceId).catch(() => null);
  if (!member) redirect("/");

  const [channels, workspaces] = await Promise.all([
    getChannelsByWorkspace(workspaceId),
    getWorkspacesByUser(user.id),
  ]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Top header bar */}
      <div className="flex h-10 shrink-0 items-center justify-between bg-[#19171D] border-b border-black/30 px-3">
        {/* Nav arrows */}
        <div className="flex items-center gap-0.5">
          <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors" title="Back">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors" title="Forward">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Search bar — centered */}
        <SearchBarClient workspaceName={workspace.name} />

        {/* Right icons */}
        <div className="flex items-center gap-0.5">
          <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors" title="Help">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors" title="Notifications">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          channels={channels}
          workspaces={workspaces}
          isAdmin={member.role === "ADMIN"}
          userName={user.name ?? user.email}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
