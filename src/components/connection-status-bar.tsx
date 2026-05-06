"use client";

import { useSocket } from "~/providers/socket-provider";

export function ConnectionStatusBar() {
  const { connected } = useSocket();
  if (connected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center justify-center gap-2 bg-yellow-900/40 border-b border-yellow-700/40 px-4 py-1.5 text-xs text-yellow-300"
    >
      <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
      Reconnecting to real-time updates…
    </div>
  );
}
