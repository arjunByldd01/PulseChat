---
title: 'Sidebar search button wiring'
type: 'feature'
created: '2026-05-04'
status: 'done'
route: 'one-shot'
---

# Sidebar search button wiring

## Intent

**Problem:** The sidebar had a static search button that looked interactive but did nothing on click. The search overlay was already implemented (Goal 1) and its open state was lifted into the Zustand store, but the sidebar button wasn't wired to it.

**Approach:** One-shot change across two files — import `useWorkspaceStore` into `sidebar.tsx`, destructure `setSearchOpen`, and attach `onClick={() => setSearchOpen(true)}` to the sidebar search button. Added `aria-haspopup="dialog"` and `aria-label` to match the top-bar trigger semantics.

## Suggested Review Order

- `useWorkspaceStore` import + `setSearchOpen` destructure in `Sidebar` function
  [`sidebar.tsx:4`](../../src/components/sidebar.tsx#L4)

- `onClick`, `aria-haspopup`, and `aria-label` on the sidebar search button
  [`sidebar.tsx:196`](../../src/components/sidebar.tsx#L196)
