"use client";

import { useEffect, useState } from "react";
import { useSocket } from "~/providers/socket-provider";
import { useWorkspaceStore, type Message } from "~/store/workspace-store";
import { MessageList } from "~/components/message-list";
import { MessageComposer } from "~/components/message-composer";
import { ConnectionStatusBar } from "~/components/connection-status-bar";
import { MembersModal } from "~/components/members-modal";

interface Props {
  channel: { id: string; name: string; description?: string | null };
  workspaceId: string;
  initialMessages: Message[];
  isAdmin: boolean;
  currentUserId: string;
}

const CHANNEL_TABS = ["Messages", "Bookmarks", "Files", "Meets", "Pins"];

export function ChannelView({ channel, workspaceId, initialMessages, isAdmin, currentUserId }: Props) {
  const { joinChannel } = useSocket();
  const { setMessages, setActiveChannel } = useWorkspaceStore();
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState(CHANNEL_TABS[0] ?? "Messages");

  useEffect(() => {
    setMessages(channel.id, initialMessages);
    setActiveChannel(channel.id);
    joinChannel(channel.id);
  }, [channel.id, initialMessages, setMessages, setActiveChannel, joinChannel]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1a1d21]">
      {/* Channel header */}
      <div className="flex shrink-0 flex-col border-b border-white/10">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <button className="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-white/10 transition-colors">
              <svg className="h-4 w-4 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-base leading-none text-[#ABABAD]">#</span>
              <h2 className="text-[15px] font-bold text-white">{channel.name}</h2>
            </button>
            {channel.description && (
              <>
                <span className="text-white/15">|</span>
                <p className="truncate text-sm text-[#ABABAD] max-w-xs">{channel.description}</p>
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1 rounded px-2 py-1 text-[#ABABAD] hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[13px]">Members</span>
            </button>
            <div className="h-5 w-px bg-white/10 mx-0.5" />
            <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white" title="Search in channel">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white" title="More">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div role="tablist" className="flex items-center overflow-x-auto px-3 scrollbar-none">
          {CHANNEL_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              onClick={() => setActiveTab(tab)}
              aria-selected={tab === activeTab}
              className={`shrink-0 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                tab === activeTab
                  ? "border-white font-semibold text-white"
                  : "border-transparent text-[#ABABAD] hover:border-white/20 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="shrink-0 border-b-2 border-transparent px-2 py-2 text-[13px] font-medium text-[#ABABAD] hover:text-white transition-colors">
            +
          </button>
        </div>
      </div>

      <ConnectionStatusBar />

      {/* Messages tab — hidden rather than unmounted to preserve composer draft state */}
      <div className={`flex flex-1 flex-col overflow-hidden ${activeTab !== "Messages" ? "hidden" : ""}`}>
        <MessageList channelId={channel.id} />
        <MessageComposer channelId={channel.id} workspaceId={workspaceId} channelName={channel.name} />
      </div>

      {activeTab !== "Messages" && (
        <div className="flex flex-1 items-center justify-center text-[#ABABAD]">
          <div className="text-center">
            <p aria-hidden="true" className="text-2xl">🚧</p>
            <p className="mt-2 text-sm font-medium">{activeTab}</p>
            <p className="text-xs text-[#616061]">Coming soon</p>
          </div>
        </div>
      )}

      <MembersModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        workspaceId={workspaceId}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
