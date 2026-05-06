# Test Automation Summary

Generated: 2026-05-05

## Framework

**Playwright** (`@playwright/test` v1.59) — chosen for this Next.js 15 + App Router stack.
Browser: Chromium (headless).

## Test Structure

```
playwright.config.ts
tests/
  global.setup.ts          — creates test users, saves admin auth state + workspaceId
  .auth/
    admin.json             — saved session cookies (gitignored)
    state.json             — { workspaceId } for use across specs
  e2e/
    fixtures/index.ts      — readState() helper
    auth.spec.ts           — 6 tests
    workspace.spec.ts      — 4 tests
    channel.spec.ts        — 4 tests
    invite.spec.ts         — 4 tests
    search.spec.ts         — 5 tests
    members.spec.ts        — 4 tests
```

## Generated Tests

### E2E Tests

- [x] `tests/e2e/auth.spec.ts` — sign-up, sign-in (valid/invalid), duplicate email, route protection, sign-out
- [x] `tests/e2e/workspace.spec.ts` — create workspace, home empty state, settings admin access, non-member rejection
- [x] `tests/e2e/channel.spec.ts` — create channel, navigate to channel, composer visible, channel tabs interactive
- [x] `tests/e2e/invite.spec.ts` — admin generates invite link, invalid token error, unauthenticated join form, authenticated member join
- [x] `tests/e2e/search.spec.ts` — overlay opens from top-bar, recent searches shown, typing shows workspace chip, Escape closes, sidebar button also opens
- [x] `tests/e2e/members.spec.ts` — modal opens, shows current user, search filters, Escape closes

## Coverage

| Flow | Tests | Status |
|---|---|---|
| Auth (sign-up, sign-in, sign-out, route protection) | 6 | ✅ |
| Workspace creation & navigation | 4 | ✅ |
| Channel creation & messaging | 4 | ✅ |
| Invite link generation & join flow | 4 | ✅ |
| Search overlay | 5 | ✅ |
| Members modal | 4 | ✅ |
| **Total** | **27** | |

## Running the Tests

### Prerequisites

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Start the app (if not already running)
npm run dev
```

### Commands

```bash
# Run all tests (headless)
npm test

# Interactive UI mode
npm run test:ui

# View last HTML report
npm run test:report
```

### CI

Tests run with `workers: 1` (serial) because multiple specs share a Postgres database. In CI, set `CI=true` which enables:
- `forbidOnly: true`
- `retries: 1`

The webServer config will auto-start `npm run dev` in CI if port 3000 is not already bound. Docker services (Postgres + Redis) must be started separately before the test run.

## Notes

- Messaging (send → real-time receive) is not tested here because it requires the Socket.io server and Redis to be active. The composer visibility is verified as a proxy.
- The invite join flow handles both the "already a member" redirect case and the "click Join" button case gracefully.
- All test users use the `@test.local` domain — safe to create in any environment.
