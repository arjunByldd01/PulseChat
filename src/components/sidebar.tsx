"use client";

import { useState } from "react";
import { useWorkspaceStore } from "~/store/workspace-store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "~/lib/utils";
import { CreateWorkspaceDialog } from "~/components/create-workspace-dialog";
import { CreateChannelDialog } from "~/components/create-channel-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface Channel { id: string; name: string }
interface Workspace { id: string; name: string }
interface Props {
  workspaceId: string;
  workspaceName: string;
  channels: Channel[];
  workspaces: Workspace[];
  isAdmin: boolean;
  userName: string;
}

const WS_COLORS = [
  "#E01E5A","#36C5F0","#2EB67D","#ECB22E",
  "#E8912D","#611f69","#CC4C2F","#1264A3",
];
function wsColor(name: string) {
  return WS_COLORS[name.charCodeAt(0) % WS_COLORS.length]!;
}

function WorkspaceIcon({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
      style={{ width: size, height: size, backgroundColor: wsColor(name), fontSize: size * 0.45 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

/* ── Left icon strip ── */
function IconStrip({ workspaceName, workspaces, isAdmin, workspaceId, onNewWorkspace }: {
  workspaceName: string; workspaces: Workspace[]; isAdmin: boolean;
  workspaceId: string; onNewWorkspace: () => void;
}) {
  return (
    <div className="flex w-[68px] shrink-0 flex-col items-center gap-1 overflow-y-auto bg-[#19171D] py-3">
      {/* workspace avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mb-2 rounded-xl outline-none ring-2 ring-white/30 hover:ring-white/60 transition-all">
            <WorkspaceIcon name={workspaceName} size={36} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-60">
          {workspaces.map((ws) => (
            <DropdownMenuItem key={ws.id} asChild>
              <Link href={`/workspace/${ws.id}`} className="flex items-center gap-2">
                <WorkspaceIcon name={ws.name} size={20} />
                <span className="text-sm">{ws.name}</span>
                {ws.id === workspaceId && <span className="ml-auto text-xs">✓</span>}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onNewWorkspace} className="text-sm">
            + Add a workspace
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href={`/workspace/${workspaceId}/settings`} className="text-sm">Settings</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-sm text-red-600" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* nav icons */}
      {[
        { label: "Home", icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
          </svg>
        )},
        { label: "Activity", icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        )},
        { label: "DMs", icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
        )},
        { label: "Files", icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
        )},
      ].map(({ label, icon }) => (
        <button
          key={label}
          title={label}
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors"
        >
          {icon}
          <span className="text-[9px] font-medium">{label}</span>
        </button>
      ))}

      <div className="mt-auto">
        <button
          title="More"
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[#ABABAD] hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
          <span className="text-[9px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
}

/* ── Main sidebar panel ── */
export function Sidebar({ workspaceId, workspaceName, channels, workspaces, isAdmin, userName }: Props) {
  const pathname = usePathname();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const { setSearchOpen } = useWorkspaceStore();

  return (
    <div className="flex h-full shrink-0">
      <IconStrip
        workspaceName={workspaceName}
        workspaces={workspaces}
        isAdmin={isAdmin}
        workspaceId={workspaceId}
        onNewWorkspace={() => setShowCreateWorkspace(true)}
      />

      {/* sidebar panel */}
      <aside className="flex w-[220px] flex-col bg-[#1a1d21] text-[#ABABAD]">

        {/* Workspace name + actions */}
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded hover:bg-white/10 px-1 py-0.5 transition-colors max-w-[140px]">
                <span className="truncate text-[15px] font-bold text-white">{workspaceName}</span>
                <svg className="h-3.5 w-3.5 shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href={`/workspace/${workspaceId}/settings`} className="text-sm">Settings &amp; administration</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm text-red-600" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                Sign out of {workspaceName}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 shrink-0">
            {/* New message / compose */}
            <button title="New message" className="rounded p-1 text-[#ABABAD] hover:bg-white/10 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mx-2 mb-1">
          <button
            onClick={() => setSearchOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Search ${workspaceName}`}
            className="flex w-full items-center gap-2 rounded-md bg-white/10 px-3 py-[7px] text-sm text-[#ABABAD] hover:bg-white/20 transition-colors"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm">Search {workspaceName}</span>
          </button>
        </div>

        {/* Quick nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {[
            { label: "Unread", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
            { label: "Threads", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
            { label: "Drafts & Sent", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
          ].map(({ label, icon }) => (
            <button key={label} className="flex w-full items-center gap-2 rounded px-2 py-[6px] text-sm text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors">
              {icon}
              {label}
            </button>
          ))}

          <div className="my-2 border-t border-white/10" />

          {/* Channels */}
          <div>
            <button
              onClick={() => setChannelsOpen((o) => !o)}
              className="flex w-full items-center gap-1 rounded px-2 py-[6px] text-sm text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg
                className={cn("h-3 w-3 shrink-0 transition-transform duration-150", channelsOpen ? "rotate-90" : "")}
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Channels</span>
            </button>

            {channelsOpen && (
              <div className="mt-0.5 space-y-0.5">
                {channels.map((ch) => {
                  const href = `/workspace/${workspaceId}/channel/${ch.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={ch.id}
                      href={href}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-2 py-[5px] text-sm transition-colors",
                        active
                          ? "bg-[#1264a3] font-semibold text-white"
                          : "text-[#ABABAD] hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span className="shrink-0 text-base leading-none">#</span>
                      <span className="truncate">{ch.name}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-[5px] text-sm text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#ABABAD]/30 text-[11px] font-bold">+</span>
                  Add a channel
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded px-1 py-1.5 hover:bg-white/10 transition-colors">
                <div className="relative shrink-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: wsColor(userName) }}
                  >
                    {userName[0]?.toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1a1d21] bg-green-400" />
                </div>
                <span className="flex-1 truncate text-left text-sm font-medium text-white">{userName}</span>
                <svg className="h-4 w-4 shrink-0 text-[#ABABAD]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem className="text-sm">Set yourself as away</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm text-red-600" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <CreateWorkspaceDialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace} />
      <CreateChannelDialog open={showCreateChannel} onOpenChange={setShowCreateChannel} workspaceId={workspaceId} />
    </div>
  );
}
