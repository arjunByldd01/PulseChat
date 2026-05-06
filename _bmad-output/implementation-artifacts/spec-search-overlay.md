---
title: 'Search overlay UI'
type: 'feature'
created: '2026-05-04'
status: 'done'
baseline_commit: 'NO_VCS'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The centered search button in the workspace top bar is a static `<button>` that does nothing when clicked. Users have no way to invoke the Slack-style search experience.

**Approach:** Replace the static search button in `layout.tsx` with a `SearchBarClient` client component that owns `isOpen` state and renders a full-screen overlay matching `screenshots/search-bar.png`. Recent searches are static placeholder data — no backend in this iteration.

## Boundaries & Constraints

**Always:**
- Overlay uses `position: fixed` covering the full viewport (above sidebar, above channel view)
- Escape key and backdrop click both close the overlay
- Search input receives focus automatically when the overlay opens
- Keep `layout.tsx` as a server component — client boundary lives inside `SearchBarClient`
- Dark theme consistent with existing app (`bg-[#222529]`, `border-white/10`, `text-[#ABABAD]`)
- Use the existing Shadcn `Dialog` already installed (avoids new installs)

**Ask First:**
- Any Shadcn component needed beyond what already exists in `src/components/ui/`

**Never:**
- No backend search API calls this iteration
- Do not make `layout.tsx` a client component
- Do not touch the sidebar search button (`sidebar.tsx`) — deferred

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open | Click top-bar search button | Overlay appears, input auto-focused | N/A |
| Close — Escape | Overlay open, Escape pressed | Overlay closes | N/A |
| Close — backdrop | Overlay open, click dark area outside modal box | Overlay closes | N/A |
| Empty input | Overlay open, input empty | Show "Recent searches" section with 5 static placeholder items | N/A |
| Non-empty input | User has typed text | Hide "Recent searches"; show "Search in {workspaceName} [Enter]" chip | N/A |

</frozen-after-approval>

## Code Map

- `src/app/(app)/workspace/[workspaceId]/layout.tsx` — server layout; replace static search `<button>` block (lines 48–53) with `<SearchBarClient workspaceName={workspace.name} />`
- `src/components/search-bar-client.tsx` — NEW: client component; trigger button + overlay modal
- `src/components/ui/dialog.tsx` — existing Shadcn Dialog used for the overlay

## Tasks & Acceptance

**Execution:**
- [x] `src/components/search-bar-client.tsx` — CREATE: `"use client"` component with `isOpen` state. Renders: (a) a trigger `<button>` matching existing top-bar styling (search icon + "Search {workspaceName}" text + `bg-white/10 border-white/10 rounded-md`); (b) when `isOpen`, a `Dialog` with `open={isOpen}` and `onOpenChange` for close — inner panel has a search `<input>` (auto-focused via `autoFocus`), a "Recent searches" label + 5 static chips each with a clock SVG icon (static terms: "weekday", "in:#general messages", "project update", "standup", "deployment"), and a workspace search chip (`Search in {workspaceName} [Enter]`) shown only when input is non-empty. Close on Escape handled by Dialog natively; close on backdrop click via `onOpenChange`.
- [x] `src/app/(app)/workspace/[workspaceId]/layout.tsx` — REPLACE the static `<button>` search block (the `flex max-w-sm` button around lines 48–53) with `<SearchBarClient workspaceName={workspace.name} />` and add `import { SearchBarClient } from "~/components/search-bar-client"`

**Acceptance Criteria:**
- Given workspace is loaded, when user clicks the top-bar centered search button, then the search overlay appears fullscreen covering the app
- Given overlay is open and input is empty, when overlay renders, then "Recent searches" section shows 5 placeholder items each with a clock icon
- Given overlay is open and user types any text, when input value is non-empty, then "Recent searches" section is hidden and a "Search in {workspaceName}" chip appears with an "Enter" badge
- Given overlay is open, when user presses Escape, then overlay closes
- Given overlay is open, when user clicks the dark backdrop, then overlay closes
- Given overlay is open, when user clicks the trigger button area again, then overlay stays open (Dialog handles this)

## Verification

**Commands:**
- `npm run build` -- expected: exits 0, zero TypeScript errors

**Manual checks:**
- Click top-bar search → overlay appears, input is focused
- Type text → recent searches hide, workspace chip appears
- Escape → overlay closes
- Click backdrop → overlay closes
- No console errors on open/close cycle

## Suggested Review Order

**Search overlay component — main change**

- Component entry: state, ref, and open/close handlers
  [`search-bar-client.tsx:35`](../../src/components/search-bar-client.tsx#L35)

- Trigger button with `aria-haspopup="dialog"` wired to `handleOpen`
  [`search-bar-client.tsx:53`](../../src/components/search-bar-client.tsx#L53)

- DialogPrimitive.Root + custom `onOpenAutoFocus` to focus input instead of dialog root
  [`search-bar-client.tsx:64`](../../src/components/search-bar-client.tsx#L64)

- Content panel: `aria-label`, fixed positioning at `top-[72px]`
  [`search-bar-client.tsx:67`](../../src/components/search-bar-client.tsx#L67)

- Search input with ref; clear button refocuses input after clearing
  [`search-bar-client.tsx:78`](../../src/components/search-bar-client.tsx#L78)

- Workspace chip always visible; recent searches conditional on `!query`
  [`search-bar-client.tsx:101`](../../src/components/search-bar-client.tsx#L101)

**Layout wiring**

- Static search `<button>` replaced with `<SearchBarClient>` — server component boundary preserved
  [`layout.tsx:48`](../../src/app/(app)/workspace/%5BworkspaceId%5D/layout.tsx#L48)

**Store type fix (pre-existing bug)**

- `setActiveChannel` signature corrected to 1 arg; unused `activeChannelName` removed
  [`workspace-store.ts:13`](../../src/store/workspace-store.ts#L13)

**Pre-existing build fixes**

- `useSearchParams` wrapped in `Suspense` to satisfy Next.js static prerender
  [`sign-in/page.tsx:7`](../../src/app/(auth)/sign-in/page.tsx#L7)

- Optional-chain lint fixes (3 files): channel page, channels route, members/join route
  [`channel/[channelId]/page.tsx:18`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/page.tsx#L18)
