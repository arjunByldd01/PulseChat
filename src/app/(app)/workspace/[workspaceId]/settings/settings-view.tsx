"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "~/components/ui/dialog";

interface Channel { id: string; name: string }
interface Member {
  id: string; userId: string; role: string; joinedAt: string;
  name: string | null; email: string | null;
}
interface Props {
  workspaceId: string; workspaceName: string; channels: Channel[];
  members: Member[]; isAdmin: boolean; currentUserId: string;
  existingToken: string | null; baseUrl: string;
}

export function SettingsView({
  workspaceId, workspaceName, channels, members: initialMembers,
  isAdmin, currentUserId, existingToken, baseUrl,
}: Props) {
  const router = useRouter();
  const [channelList, setChannelList] = useState(channels);
  const [memberList, setMemberList] = useState(initialMembers);
  const [inviteToken, setInviteToken] = useState(existingToken);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "channels" | "invite">(
    isAdmin ? "members" : "members"
  );

  const inviteUrl = inviteToken ? `${baseUrl}/invite/${inviteToken}` : null;

  async function generateInviteLink() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite-tokens`, { method: "POST" });
      const data = (await res.json()) as { token?: string };
      if (data.token) setInviteToken(data.token);
    } finally { setLoading(false); }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function confirmDeleteChannel() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await fetch(`/api/workspaces/${workspaceId}/channels/${deleteTarget.id}`, { method: "DELETE" });
      setChannelList((p) => p.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } finally { setLoading(false); }
  }

  async function confirmRemoveMember() {
    if (!removeTarget) return;
    setLoading(true);
    try {
      await fetch(`/api/workspaces/${workspaceId}/members/${removeTarget.userId}`, { method: "DELETE" });
      setMemberList((p) => p.filter((m) => m.userId !== removeTarget.userId));
      setRemoveTarget(null);
    } finally { setLoading(false); }
  }

  const tabs = [
    { id: "members" as const, label: "Members" },
    ...(isAdmin ? [
      { id: "channels" as const, label: "Channels" },
      { id: "invite" as const, label: "Invite people" },
    ] : []),
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1a1d21]">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold text-white">{workspaceName}</h1>
        <div className="mt-3 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-white/10 text-white"
                  : "text-[#ABABAD] hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Members tab */}
        {activeTab === "members" && (
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-[#ABABAD]">{memberList.length} member{memberList.length !== 1 ? "s" : ""}</p>
            {memberList.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4a154b] text-sm font-bold text-white">
                  {(m.name ?? m.email ?? "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name ?? m.email}</p>
                  <p className="text-xs text-[#ABABAD] truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={m.role === "ADMIN" ? "default" : "secondary"} className={m.role === "ADMIN" ? "bg-[#4a154b]" : "bg-white/10 text-[#ABABAD]"}>
                    {m.role === "ADMIN" ? "Admin" : "Member"}
                  </Badge>
                  {isAdmin && m.userId !== currentUserId && (
                    <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:bg-red-900/30 hover:text-red-300" onClick={() => setRemoveTarget(m)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Channels tab */}
        {activeTab === "channels" && isAdmin && (
          <div className="max-w-2xl space-y-3">
            {channelList.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#ABABAD]">#</span>
                  <span className="text-sm font-medium text-white">{ch.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-red-400 hover:bg-red-900/30 hover:text-red-300" onClick={() => setDeleteTarget(ch)}>
                  Delete
                </Button>
              </div>
            ))}
            {channelList.length === 0 && <p className="text-sm text-[#ABABAD]">No channels yet.</p>}
          </div>
        )}

        {/* Invite tab */}
        {activeTab === "invite" && isAdmin && (
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Invite link</h2>
              <p className="mt-1 text-sm text-[#ABABAD]">Share this link with people you&apos;d like to invite to {workspaceName}.</p>
            </div>
            {inviteUrl ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-3 break-all font-mono text-sm text-[#D1D2D3]">{inviteUrl}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#4a154b] hover:bg-[#611f69]" onClick={copyLink}>
                    {copied ? "Copied!" : "Copy link"}
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={generateInviteLink} disabled={loading}>
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="bg-[#4a154b] hover:bg-[#611f69]" onClick={generateInviteLink} disabled={loading}>
                Generate invite link
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete channel dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete #{deleteTarget?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">All messages will be permanently removed. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteChannel} disabled={loading}>Delete channel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove {removeTarget?.name ?? removeTarget?.email}?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">They will immediately lose access to {workspaceName}.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemoveMember} disabled={loading}>Remove member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
