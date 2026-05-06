"use client";

import { useState, useRef } from "react";
import { useSocket } from "~/providers/socket-provider";

interface Props {
  channelId: string;
  workspaceId: string;
  channelName: string;
}

export function MessageComposer({ channelId, workspaceId, channelName }: Props) {
  const { sendMessage, connected } = useSocket();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const content = value.trim();
    if (!content || !connected) return;
    sendMessage({ content, channelId, workspaceId });
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const canSend = value.trim().length > 0 && connected;

  return (
    <div className="px-5 pb-5 pt-2">
      <div className={`rounded-lg border bg-[#222529] shadow-sm ${connected ? "border-[#565856]" : "border-[#3d3f40] opacity-75"}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-white/10 px-3 py-1.5">
          {[
            { label: "Bold", icon: "B", cls: "font-bold" },
            { label: "Italic", icon: "I", cls: "italic" },
            { label: "Strikethrough", icon: "S", cls: "line-through" },
          ].map(({ label, icon, cls }) => (
            <button key={label} title={label} className={`rounded px-1.5 py-0.5 text-xs text-[#ABABAD] hover:bg-white/10 hover:text-white ${cls}`}>
              {icon}
            </button>
          ))}
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button title="Link" className="rounded px-1.5 py-0.5 text-[#ABABAD] hover:bg-white/10 hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button title="List" className="rounded px-1.5 py-0.5 text-[#ABABAD] hover:bg-white/10 hover:text-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Text area */}
        <div className="px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => { setValue(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={connected ? `Message #${channelName}` : "You're offline…"}
            disabled={!connected}
            className="w-full resize-none bg-transparent text-[15px] leading-6 text-white outline-none placeholder:text-[#565856] disabled:cursor-not-allowed"
            aria-label={`Message #${channelName}`}
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-0.5">
            <button title="Attach file" className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button title="Emoji" className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button title="Mention" className="rounded p-1.5 text-[#ABABAD] hover:bg-white/10 hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              canSend ? "bg-[#007a5a] text-white hover:bg-[#148567]" : "bg-white/10 text-[#616061] cursor-not-allowed"
            }`}
            title="Send message"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-[#616061]">
        <strong className="text-[#ABABAD]">Enter</strong> to send &middot; <strong className="text-[#ABABAD]">Shift+Enter</strong> for new line
      </p>
    </div>
  );
}
