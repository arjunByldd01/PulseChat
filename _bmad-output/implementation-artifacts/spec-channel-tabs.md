---
title: 'Channel tab activation'
type: 'feature'
created: '2026-05-04'
status: 'done'
route: 'one-shot'
---

# Channel tab activation

## Intent

**Problem:** The Messages/Bookmarks/Files/Meets/Pins tab bar in the channel header was fully static — clicking any tab did nothing, and "Messages" was always hard-coded as active via `i === 0`.

**Approach:** Added `activeTab` state (derived from `CHANNEL_TABS[0]`), wired each tab button with `onClick`, applied `role="tablist"` / `role="tab"` / `aria-selected` for ARIA semantics, and gated content rendering — hiding rather than unmounting the Messages pane to preserve composer draft state when switching tabs. Other tabs show a "Coming soon" placeholder.

## Suggested Review Order

- State initialisation derived from `CHANNEL_TABS[0]`; avoids magic string duplication
  [`channel-view.tsx:25`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L25)

- `role="tablist"` on container, `role="tab"` + `aria-selected` on each button
  [`channel-view.tsx:82`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L82)

- Messages pane wrapped in `hidden` div instead of conditional unmount — preserves draft
  [`channel-view.tsx:102`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L102)

- Placeholder panel with `aria-hidden` emoji, shown only for non-Messages tabs
  [`channel-view.tsx:109`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L109)
