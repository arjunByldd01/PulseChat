"use client";

import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { MessageItem } from "~/components/message-item";
import { useWorkspaceStore } from "~/store/workspace-store";
import type { Message } from "~/store/workspace-store";

interface Props {
  channelId: string;
}

function isSameAuthorAndMinute(a: Message, b: Message) {
  return (
    a.userId === b.userId &&
    Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) < 5 * 60 * 1000
  );
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function MessageList({ channelId }: Props) {
  const { messages, prependMessages } = useWorkspaceStore();
  const channelMessages = messages[channelId] ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isAtBottom = useRef(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
    isAtBottom.current = true;
  }, [channelId]);

  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowNewBadge(true);
    }
  }, [channelMessages.length]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottom.current = atBottom;
    if (atBottom) setShowNewBadge(false);
    if (el.scrollTop < 120 && hasMore && !loadingOlder) void loadOlder();
  }

  const loadOlder = useCallback(async () => {
    const oldest = channelMessages[0];
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/messages?cursor=${oldest.id}&take=50`);
      if (!res.ok) return;
      const older = (await res.json()) as Message[];
      if (older.length === 0) { setHasMore(false); return; }
      const el = containerRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      prependMessages(channelId, older);
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight; });
    } finally {
      setLoadingOlder(false);
    }
  }, [channelId, channelMessages, prependMessages, hasMore]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll} className="flex flex-1 flex-col overflow-y-auto py-4">
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[#1264a3]" />
          </div>
        )}
        {!hasMore && channelMessages.length > 0 && (
          <div className="mx-6 mb-4 flex items-center gap-3">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-[#616061]">Beginning of channel history</span>
            <div className="flex-1 border-t border-white/10" />
          </div>
        )}
        {channelMessages.length === 0 && !loadingOlder && (
          <div className="flex flex-1 items-center justify-center text-sm text-[#616061]">
            No messages yet. Be the first to say something!
          </div>
        )}
        {channelMessages.map((m, i) => {
          const prev = channelMessages[i - 1];
          const showDateSep = !prev || !isSameDay(prev.createdAt, m.createdAt);
          const grouped = !!prev && !showDateSep && isSameAuthorAndMinute(prev, m);
          return (
            <Fragment key={m.id}>
              {showDateSep && (
                <div className="mx-6 my-3 flex items-center gap-3">
                  <div className="flex-1 border-t border-white/10" />
                  <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs font-medium text-[#ABABAD]">
                    {getDateLabel(m.createdAt)}
                  </span>
                  <div className="flex-1 border-t border-white/10" />
                </div>
              )}
              <MessageItem message={m} isGrouped={grouped} />
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showNewBadge && (
        <button
          onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); setShowNewBadge(false); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#1264a3] px-4 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-[#0f5290]"
        >
          New messages ↓
        </button>
      )}
    </div>
  );
}
