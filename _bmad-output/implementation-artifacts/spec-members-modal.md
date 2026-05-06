---
title: 'Members modal in channel view'
type: 'feature'
created: '2026-05-04'
status: 'done'
baseline_commit: 'NO_VCS'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The "Members" button in the channel header is static — clicking it does nothing. Users have no way to see who is in the workspace from the channel view.

**Approach:** Wire the Members button to open a Dialog matching `screenshots/member-in-channel.png`. The modal fetches from the existing `GET /api/workspaces/[id]/members` endpoint, shows a filterable member list with avatars, name, role, and a Remove action for admins. No new API routes needed.

## Boundaries & Constraints

**Always:**
- Use the existing Shadcn `Dialog` (`src/components/ui/dialog.tsx`)
- Member list is client-fetched on modal open (not server-rendered) to keep `channel-view.tsx` fast
- Dark theme consistent with the rest of the app
- Remove confirmation uses a simple `window.confirm` — no extra dialog
- `currentUserId` must never render a Remove button for the current user's own row
- `isAdmin` and `currentUserId` are threaded down from `page.tsx` → `ChannelView` → `MembersModal`

**Ask First:**
- Any approach that requires new API routes or schema changes

**Never:**
- No Huddle button, no About/Tabs/Integrations/Settings sub-tabs (screenshot context only — not in scope)
- Do not add pagination; the member list is expected to be small (< 100) for MVP
- Do not touch sidebar, settings page, or any other component

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open modal | Click "Members" button | Dialog opens; loading spinner shown; members fetched | Fetch error → show "Failed to load members" message |
| Search members | Type in "Find members" input | List filters to matching name/email (case-insensitive) | N/A |
| No match | Search term matches nobody | Show "No members found" empty state | N/A |
| Remove member (admin) | Admin clicks "Remove" on a member row | `window.confirm` → DELETE call → member removed from list | Failure → alert with error |
| Remove self | currentUserId row | No Remove button rendered | N/A |
| Non-admin view | User is not admin | Remove buttons hidden for all rows | N/A |

</frozen-after-approval>

## Code Map

- `src/app/(app)/workspace/[workspaceId]/channel/[channelId]/page.tsx` — server page; add `isAdmin`, `currentUserId` to `ChannelView` props
- `src/app/(app)/workspace/[workspaceId]/channel/[channelId]/channel-view.tsx` — accept new props; wire Members button to open state; render `MembersModal`
- `src/components/members-modal.tsx` — NEW: Dialog with member fetch, search filter, member rows, remove action
- `src/components/ui/dialog.tsx` — existing Shadcn Dialog (no changes needed)
- `GET /api/workspaces/[id]/members` — existing endpoint; returns `{ id, userId, role, joinedAt, user: { id, name, email } }[]`
- `DELETE /api/workspaces/[id]/members/[userId]` — existing endpoint for removal

## Tasks & Acceptance

**Execution:**
- [x] `src/components/members-modal.tsx` — CREATE: `"use client"` component accepting `{ open, onClose, workspaceId, isAdmin, currentUserId }`. On `open` becoming true, fetch `GET /api/workspaces/{workspaceId}/members`. Render: Dialog with title "Members", a `<input placeholder="Find members">` filter, scrollable list of member rows (avatar circle with initials + hash-based bg color, display name, email, role badge "Admin"/"Member", Remove button if `isAdmin && member.userId !== currentUserId`). Remove flow: `window.confirm` → `DELETE /api/workspaces/{workspaceId}/members/{userId}` → remove from local state. Loading and error states required.
- [x] `src/app/(app)/workspace/[workspaceId]/channel/[channelId]/channel-view.tsx` — ADD props `isAdmin: boolean` and `currentUserId: string` to `Props` interface; add `showMembers` state; wire the "Members" `<button>` `onClick` to `setShowMembers(true)`; render `<MembersModal open={showMembers} onClose={() => setShowMembers(false)} workspaceId={workspaceId} isAdmin={isAdmin} currentUserId={currentUserId} />` at bottom of component; add import.
- [x] `src/app/(app)/workspace/[workspaceId]/channel/[channelId]/page.tsx` — PASS `isAdmin={member.role === "ADMIN"}` and `currentUserId={user.id}` to `<ChannelView>`. The `member` variable is already in scope from `requireWorkspaceMember`; `user` is already in scope.

**Acceptance Criteria:**
- Given the channel view is open, when the user clicks "Members", then the modal opens and shows a loading state
- Given the modal has loaded, when it renders, then each member row shows an avatar with initials, display name, email, and a role badge
- Given the user is admin, when the modal renders, then each row except the current user's has a "Remove" button
- Given the user is not admin, when the modal renders, then no Remove buttons are visible
- Given the modal is open, when the user types in "Find members", then the list filters case-insensitively by name or email
- Given search returns no matches, when rendered, then "No members found" empty state is shown
- Given admin clicks Remove and confirms, when DELETE succeeds, then the member disappears from the list without reload
- Given the modal open fails with a network error, when rendered, then "Failed to load members" message is shown

## Verification

**Commands:**
- `npm run build` -- expected: exits 0, zero TypeScript errors

**Manual checks:**
- Click Members → modal opens with spinner, then member list
- Type partial name → list filters live
- Admin Remove flow: confirm → member removed from list
- Non-admin: no Remove buttons
- Escape / backdrop → modal closes

## Suggested Review Order

**Members modal component — main change**

- Component entry: state shape and AbortController fetch pattern
  [`members-modal.tsx:45`](../../src/components/members-modal.tsx#L45)

- Fetch with abort; error/loading state; cleanup on unmount/close
  [`members-modal.tsx:52`](../../src/components/members-modal.tsx#L52)

- Remove handler: confirm → DELETE → filter local state → clear error
  [`members-modal.tsx:72`](../../src/components/members-modal.tsx#L72)

- Case-insensitive search filter on name and email
  [`members-modal.tsx:90`](../../src/components/members-modal.tsx#L90)

- Member row: avatar, initials guard, role badge, conditional Remove with aria attrs
  [`members-modal.tsx:140`](../../src/components/members-modal.tsx#L140)

**Channel view wiring**

- Props extended; showMembers state; Members button onClick wired
  [`channel-view.tsx:10`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L10)

- MembersModal rendered at bottom of ChannelView
  [`channel-view.tsx:99`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/channel-view.tsx#L99)

**Page — prop threading**

- requireWorkspaceMember captured; isAdmin and currentUserId passed to ChannelView
  [`page.tsx:20`](../../src/app/(app)/workspace/%5BworkspaceId%5D/channel/%5BchannelId%5D/page.tsx#L20)
