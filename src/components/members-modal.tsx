"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  isAdmin: boolean;
  currentUserId: string;
}

const AVATAR_COLORS = [
  "#E01E5A", "#36C5F0", "#2EB67D", "#ECB22E",
  "#E8912D", "#611f69", "#CC4C2F", "#1264A3",
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function initials(name: string | null, email: string) {
  const src = (name ?? email).trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return (src[0] ?? "?").toUpperCase();
}

export function MembersModal({ open, onClose, workspaceId, isAdmin, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/workspaces/${workspaceId}/members`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load members");
        return res.json() as Promise<Member[]>;
      })
      .then(setMembers)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Failed to load members");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, workspaceId]);

  async function handleRemove(member: Member) {
    const displayName = member.user.name ?? member.user.email;
    if (!window.confirm(`Remove ${displayName} from this workspace?`)) return;
    setRemoving(member.userId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${member.userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Remove failed");
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      setError(null);
    } catch {
      alert("Failed to remove member. Please try again.");
    } finally {
      setRemoving(null);
    }
  }

  const filtered = members.filter((m) => {
    const term = search.toLowerCase();
    return (
      (m.user.name ?? "").toLowerCase().includes(term) ||
      m.user.email.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] flex flex-col gap-0 overflow-hidden border-white/10 bg-[#1a1d21] p-0 text-white sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 pb-3 pt-5">
          <DialogTitle className="text-base font-bold text-white">Members</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-[#ABABAD]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Find members"
              placeholder="Find members"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#616061]"
            />
          </div>
        </div>

        {/* Member count */}
        {!loading && !error && (
          <p className="shrink-0 px-5 pb-1 pt-3 text-xs font-semibold text-[#616061]">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}

          {error && !loading && (
            <p className="py-8 text-center text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[#ABABAD]">No members found</p>
          )}

          {!loading && !error && filtered.map((m) => {
            const displayName = m.user.name ?? m.user.email;
            const isCurrentUser = m.userId === currentUserId;
            const isRemoving = removing === m.userId;

            return (
              <div
                key={m.userId}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: avatarColor(m.userId) }}
                  >
                    {initials(m.user.name, m.user.email)}
                  </div>
                  {isCurrentUser && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1a1d21] bg-green-400" />
                  )}
                </div>

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                    {displayName}
                    {isCurrentUser && (
                      <span className="text-xs font-normal text-[#ABABAD]">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-[#ABABAD]">{m.user.email}</p>
                </div>

                {/* Role + remove */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                    m.role === "ADMIN"
                      ? "bg-[#4a154b]/60 text-purple-300"
                      : "bg-white/10 text-[#ABABAD]"
                  }`}>
                    {m.role === "ADMIN" ? "Admin" : "Member"}
                  </span>

                  {isAdmin && !isCurrentUser && (
                    <button
                      onClick={() => handleRemove(m)}
                      disabled={isRemoving}
                      aria-label={`Remove ${displayName}`}
                      aria-busy={isRemoving}
                      className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50"
                    >
                      {isRemoving ? "…" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
