# Deferred Work

Items deferred during multi-goal split on 2026-05-04.

## Goal 2 — Members modal in channel
The static "Members" button in the channel header (`channel-view.tsx`) should open a dialog matching `screenshots/member-in-channel.png`. Shows a searchable member list with avatars, display name, role, and a Remove button (admin only). Can reuse the existing `/api/workspaces/[id]/members` API already powering the settings page. New component: `MembersModal`.

## Search overlay — deferred from review (2026-05-04)
- Recent search items and workspace chip are `<div>` elements with no onClick handler — clicking does nothing. Needs backend search API + routing to make them functional.
- Enter key in search input has no handler (no backend search in this iteration).
- Fixed `top-[72px]` positioning not responsive on small-screen / mobile viewports.
- Whitespace-only query treated same as empty (shows recent searches) — should trim or distinguish.
- Interactive items (workspace chip, recent items) are not keyboard-navigable (no tabIndex/role) — requires search results backend to implement properly.

## Members modal — deferred from review (2026-05-04)
- `window.confirm`/`alert` use displayName (user-controlled string) — spoofable UI text; replace with inline confirmation UI in a future pass.
- Member list has no ARIA list semantics (`role="list"` / `role="listitem"`) — enhancement for screen reader users.
- Online-status dot conveys state via color alone — add `aria-label="Online"` in a future pass.
- Role staleness: `isAdmin` is set at page load; real-time role changes not reflected until refresh.
- Very large member lists (500+) may feel cramped at `max-h-[80vh]`; consider virtual scrolling.

## Channel tabs — deferred from review (2026-05-04)
- Arrow key navigation between tabs (ARIA tab pattern requires Left/Right arrows per WCAG 2.1.1) — defer until Bookmarks/Files/Meets/Pins have real content.
- Active tab not reflected in URL — deep-linking and back-button behaviour; requires query param or route segment approach.
- Color-only active indicator — border color + font weight partially address this; a background fill would make it fully WCAG 1.4.1 compliant.

## Goal 3 — Channel tab activation (DONE — see spec-channel-tabs.md)
The Messages/Bookmarks/Files/Meets/Pins tab bar in `channel-view.tsx` (already rendered, all tabs are static) should become interactive — clicking a tab updates active state and renders appropriate content panel. Placeholder panels are acceptable for Bookmarks/Files/Meets/Pins at this stage.
