"use client";

import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogPortal, DialogOverlay } from "~/components/ui/dialog";
import { useWorkspaceStore } from "~/store/workspace-store";

const RECENT_SEARCHES = [
  "weekday",
  "in:#general messages",
  "project update",
  "standup",
  "deployment",
];

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-[#616061]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

interface Props {
  workspaceName: string;
}

export function SearchBarClient({ workspaceName }: Props) {
  const { searchOpen, setSearchOpen } = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setSearchOpen(true);
    setQuery("");
  }

  function handleOpenChange(open: boolean) {
    setSearchOpen(open);
    if (!open) setQuery("");
  }

  return (
    <>
      {/* Top-bar trigger button */}
      <button
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-label={`Search ${workspaceName}`}
        className="flex max-w-sm flex-1 mx-4 items-center gap-2 rounded-md bg-white/10 border border-white/10 px-3 py-1 text-sm text-[#ABABAD] hover:bg-white/15 transition-colors"
      >
        <SearchIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Search {workspaceName}</span>
      </button>

      {/* Search overlay */}
      <DialogPrimitive.Root open={searchOpen} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/60 backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            aria-label={`Search ${workspaceName}`}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
            className="fixed left-1/2 top-[72px] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-white/10 bg-[#222529] shadow-2xl outline-none"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-[#ABABAD]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across people, channels, files, workflows, and more"
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#616061]"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="shrink-0 text-[#ABABAD] hover:text-white"
                  aria-label="Clear search"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="py-2 pb-3">
              {/* Workspace search chip — always visible */}
              <div className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-white/5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/10">
                  <SearchIcon className="h-4 w-4 text-[#ABABAD]" />
                </div>
                <span className="flex-1 text-sm text-white">
                  Search in <span className="font-medium">{workspaceName}</span>
                </span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#ABABAD]">
                  Enter
                </kbd>
              </div>

              {/* Recent searches — shown only when input is empty */}
              {!query && (
                <>
                  <div className="px-4 pb-1 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#616061]">
                      Recent searches
                    </p>
                  </div>
                  {RECENT_SEARCHES.map((term) => (
                    <div
                      key={term}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-white/5"
                    >
                      <ClockIcon />
                      <span className="text-sm text-[#ABABAD]">{term}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </DialogPrimitive.Root>
    </>
  );
}
