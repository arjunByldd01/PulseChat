---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
---

# slack-clone - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for slack-clone, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Visitors can create a new account using an email address and password
FR2: Registered users can sign in with their email and password
FR3: Registered users can sign in using their GitHub account
FR4: Authenticated users can sign out and end their session
FR5: Unauthenticated users attempting to access protected routes are redirected to the login page
FR6: Authenticated sessions persist across browser refreshes and tab reopens
FR7: Authenticated users can create a new workspace with a name
FR8: The user who creates a workspace is automatically its admin
FR9: Workspace members can view their workspace home screen after login
FR10: Users who belong to multiple workspaces can navigate between them
FR11: Workspace admins can access a workspace settings panel
FR12: Workspace members can create public channels with a name and optional description
FR13: Workspace members can view all public channels in a sidebar navigation list
FR14: Workspace members can open any channel to view its content
FR15: Workspace admins can delete channels
FR16: Workspace admins can generate a shareable invite link for their workspace
FR17: Anyone with a valid invite link can join the associated workspace
FR18: New users can create an account and join a workspace in a single invite-link flow (no separate signup step required first)
FR19: Workspace members can view the full list of members in their workspace
FR20: Workspace admins can remove a member from the workspace
FR21: Removed members immediately lose access to the workspace, its channels, and its messages
FR22: Workspace members can send text messages in any channel they have access to
FR23: All members with the channel open receive new messages instantly without refreshing the page
FR24: The client automatically reconnects to real-time updates after a connection drop
FR25: Messages sent while a client was disconnected are delivered and visible upon reconnection
FR26: Workspace members can view the complete message history of any channel they have access to
FR27: Message history loads incrementally as users scroll upward (pagination)
FR28: All messages are stored permanently — no truncation by age, count, or tier
FR29: Each message displays the sender's display name and send timestamp
FR30: All workspace data (channels, messages, members) is isolated — a member of Workspace A cannot access data belonging to Workspace B
FR31: The system verifies user authentication before accepting any WebSocket connection
FR32: Only members of a workspace can access that workspace's channels and messages
FR33: Workspace admin permissions (invite link management, member removal, channel deletion) are distinct from regular member permissions

### NonFunctional Requirements

NFR1: Message delivery latency (send → all connected clients receive) <200ms at p95 under normal load, same-region
NFR2: Channel message history (initial 50 messages) loads within 500ms on broadband
NFR3: Time to interactive for authenticated users <2 seconds on broadband
NFR4: WebSocket connection re-establishes within 3 seconds of a network interruption, without user action
NFR5: Auth API endpoints (login, signup) respond within 500ms at p95
NFR6: Passwords hashed with bcrypt, minimum cost factor 12
NFR7: Session tokens stored in HttpOnly, Secure cookies — not in localStorage or sessionStorage
NFR8: All production traffic served over HTTPS; HTTP redirects to HTTPS
NFR9: WebSocket connections authenticate via session on handshake; unauthenticated connections rejected before any data exchange
NFR10: Auth endpoints (login, signup, invite) rate-limited to max 10 requests/minute per IP
NFR11: All database queries scoped to the authenticated user's workspace membership — no cross-workspace data leakage possible
NFR12: Application protected against XSS (CSP headers, sanitised output) and CSRF (SameSite cookie policy or CSRF tokens)
NFR13: WebSocket server supports horizontal scaling via a shared pub/sub layer (Redis adapter) — a single Node.js process is not a hard connection ceiling
NFR14: Database schema supports multiple workspaces with unlimited members and channels, without per-tenant schema separation
NFR15: Each server instance handles at least 100 concurrent WebSocket connections without degradation in message delivery latency
NFR16: Core flows (signup, login, workspace navigation, channel messaging) meet WCAG 2.1 AA
NFR17: All interactive elements keyboard-navigable with visible focus indicators
NFR18: All non-decorative images and icons have ARIA labels or alt text
NFR19: UI colour contrast meets WCAG AA minimums (4.5:1 normal text, 3:1 large text)
NFR20: Messages persisted to the database before broadcast to connected clients — no delivery without persistence confirmation
NFR21: Application degrades gracefully if WebSocket server is unreachable — connection status indicator visible; previously loaded history remains accessible
NFR22: Database migrations are backward-compatible and applied without downtime via Prisma migrate

### Additional Requirements

- **Starter Template:** `create-t3-app` (TypeScript, Tailwind, Prisma, NextAuth, no tRPC, App Router). This is Epic 1 Story 1 — must run before any other implementation.
- **Shadcn/ui init:** `npx shadcn@latest init` after T3 scaffold — required before any UI components are built.
- **Socket.io server:** Separate Node.js process (port 3001) with its own `server/` directory, `server/package.json`, and `server/Dockerfile`. Must be scaffolded before any real-time feature work.
- **Redis adapter:** `@socket.io/redis-adapter` + `ioredis` required alongside Socket.io server. Redis service must be in Docker Compose.
- **Docker Compose:** 4 services — `postgres:16-alpine`, `redis:7-alpine`, `web` (Next.js :3000), `socket-server` (:3001). Must include `.env.example` with all required vars.
- **Environment variables required:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SOCKET_SERVER_URL`
- **Dev runner:** Root `package.json` must include `"dev": "concurrently \"next dev\" \"tsx watch server/index.ts\""` for running both processes.
- **Data access layer:** All Prisma queries must live exclusively in `src/server/db/*.ts` (workspace.ts, channel.ts, message.ts, member.ts). Never inline in Route Handlers or components.
- **Auth guard pattern:** Every Route Handler starts with `requireAuth()` from `src/server/auth.ts`; every workspace-scoped handler follows with `requireWorkspaceMember()`.
- **Socket.io event types:** `ServerToClientEvents` and `ClientToServerEvents` defined in `src/types/socket.ts` before any handler is written.
- **Message pagination:** Cursor-based (`cursor: messageId`, `take: 50`) — not offset. Required for stable pagination under real-time inserts.
- **Write-before-broadcast:** `createMessage()` → DB confirmed → `io.to("channel:{channelId}").emit("message:new")`. No optimistic broadcast.
- **No optimistic updates:** Client appends to Zustand only on receiving `message:new` from server (including for the sender).
- **Missed message recovery (FR25/NFR4):** On socket `connect` event, fetch `GET /api/channels/[id]/messages?after=[lastId]` to deliver missed messages.
- **Session strategy:** Database sessions (not JWT) — required for immediate access revocation (FR21).
- **Rate limiting:** `express-rate-limit` on Socket.io HTTP server; in-memory rate limiting on auth API routes (upgrade to Redis post-MVP).
- **E2E tests:** Playwright in `tests/e2e/` — required before any public release. Cover auth, workspace, channel flows.
- **GitHub CI:** `.github/workflows/ci.yml` for lint, type-check, and test on PR.

### UX Design Requirements

_No separate UX Design document was provided. UI is derived from the architecture's component structure and Shadcn/ui primitives. Key layout requirements from PRD:_

UX-DR1: Desktop-first 3-column layout — workspace sidebar (left) + channel list (center-left) + main message area (right). Designed and tested at 1280px+ first.
UX-DR2: Mobile web — sidebar collapses to drawer; single-panel view switches between channel list and message view. No horizontal scroll.
UX-DR3: Channel message list must be bottom-anchored (newest at bottom); scroll-up triggers cursor-paginated history load.
UX-DR4: New message toast/auto-scroll when a `message:new` arrives — if user is at bottom, auto-scroll; if scrolled up, show "new messages" indicator.
UX-DR5: Real-time connection status indicator — visible when WebSocket is disconnected or reconnecting (NFR21 degradation UX).
UX-DR6: Invite link panel in workspace settings — shows generated link with one-click copy button.
UX-DR7: Member list in workspace settings — shows all members with role badge; admin can remove members with confirmation.
UX-DR8: Channel creation dialog — modal with name (required, kebab-case enforced) and optional description fields.
UX-DR9: Workspace creation dialog — triggered on first login or via switcher; name field only for MVP.
UX-DR10: Message composer — single-line input expanding to multi-line; sends on Enter (Shift+Enter for newline); no send button required for MVP.

### FR Coverage Map

FR1: Epic 1 — Email/password signup
FR2: Epic 1 — Email/password sign-in
FR3: Epic 1 — GitHub OAuth sign-in
FR4: Epic 1 — Sign-out
FR5: Epic 1 — Route protection via NextAuth middleware
FR6: Epic 1 — Session persistence (database sessions)
FR7: Epic 2 — Create workspace
FR8: Epic 2 — Creator auto-assigned ADMIN role
FR9: Epic 2 — Workspace home screen
FR10: Epic 2 — Multi-workspace navigation
FR11: Epic 2 — Workspace settings panel
FR12: Epic 2 — Create public channel
FR13: Epic 2 — Channel sidebar list
FR14: Epic 2 — Open channel
FR15: Epic 2 — Admin deletes channel
FR16: Epic 3 — Generate invite link
FR17: Epic 3 — Join via valid invite link
FR18: Epic 3 — Invite-aware signup flow
FR19: Epic 3 — Member list view
FR20: Epic 3 — Admin removes member
FR21: Epic 3 — Immediate access revocation (database sessions)
FR22: Epic 4 — Send text message
FR23: Epic 4 — Real-time receive via Socket.io broadcast
FR24: Epic 4 — Auto-reconnect
FR25: Epic 4 — Missed message recovery on reconnect
FR26: Epic 4 — Full message history
FR27: Epic 4 — Scroll-up cursor pagination
FR28: Epic 4 — No message truncation
FR29: Epic 4 — Sender name + timestamp display
FR30: Epic 2 — Workspace isolation at DB layer (requireWorkspaceMember)
FR31: Epic 4 — WebSocket auth on handshake
FR32: Epic 3 — Member-only access checks
FR33: Epic 2 — RBAC — admin vs member permission split

## Epic List

### Epic 1: Project Foundation & Authentication
Developers have a running local stack (Next.js + Socket.io + Postgres + Redis via Docker Compose), and users can sign up, sign in with email/password or GitHub, sign out, and are blocked from protected routes without a session.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**NFRs covered:** NFR5, NFR6, NFR7, NFR8, NFR10, NFR12
**Infra covered:** T3 init, Shadcn, Docker Compose, env vars, Prisma schema + migration, Socket.io server scaffold, dev runner, GitHub CI

### Epic 2: Workspace & Channel Management
Authenticated users can create workspaces, create public channels within them, navigate between workspaces, and view a workspace home — all workspace data is isolated from other workspaces; admins have a settings panel and can delete channels.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR30, FR33
**NFRs covered:** NFR3, NFR11, NFR14, NFR16, NFR17, NFR18, NFR19

### Epic 3: Membership & Invitations
Admins can generate shareable invite links; new users can sign up and land directly in the workspace from that link; admins can view the member list and remove members with immediate effect.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR32
**NFRs covered:** NFR10, NFR11

### Epic 4: Real-Time Messaging & History
Team members can send text messages in channels, receive new messages instantly without refresh, scroll back through the complete unlimited message history, and have the connection silently recover after drops with missed messages delivered automatically.
**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR31
**NFRs covered:** NFR1, NFR2, NFR4, NFR9, NFR13, NFR15, NFR20, NFR21

---

## Epic 1: Project Foundation & Authentication

Developers have a running local stack (Next.js + Socket.io + Postgres + Redis via Docker Compose), and users can sign up, sign in with email/password or GitHub, sign out, and are blocked from protected routes without a session.

### Story 1.1: Initialize T3 Project Stack

As a developer,
I want a fully initialized T3 project with all required dependencies installed and a working development runner,
So that the team can start building features without setup friction.

**Acceptance Criteria:**

**Given** a clean directory
**When** the setup commands are run (`npm create t3-app@latest slack-clone` selecting TypeScript, Tailwind, Prisma, NextAuth, no tRPC, App Router; then `npx shadcn@latest init`; then `npm install socket.io socket.io-client ioredis @socket.io/redis-adapter concurrently` and `npm install -D tsx`)
**Then** `npm run dev` starts both Next.js on port 3000 and the Socket.io server on port 3001 concurrently without errors
**And** the root `package.json` `"dev"` script is `"concurrently \"next dev\" \"tsx watch server/index.ts\""`
**And** `tsc --noEmit` exits 0 (TypeScript strict mode passes)
**And** `npm run lint` exits 0 (ESLint passes)
**And** the top-level directories `src/`, `server/`, `prisma/`, and `public/` exist
**And** Shadcn/ui is initialized with the default style and CSS variables enabled

### Story 1.2: Docker Compose & Environment Configuration

As a developer,
I want a complete Docker Compose setup and documented environment variable configuration,
So that any team member can spin up the full local stack with a single command.

**Acceptance Criteria:**

**Given** Docker and Docker Compose are installed
**When** `docker compose up -d` is run from the project root
**Then** `postgres:16-alpine` starts and accepts connections on port 5432
**And** `redis:7-alpine` starts and accepts connections on port 6379
**And** `docker compose ps` shows both services as healthy/running
**And** `.env.example` exists at project root listing all required variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SOCKET_SERVER_URL`
**And** `.env` is listed in `.gitignore`
**And** the README.md contains a "Local Setup" section documenting: copy `.env.example` → `.env`, fill in values, run `docker compose up -d`, run `npx prisma migrate dev`, run `npm run dev`

### Story 1.3: Database Schema & First Migration

As a developer,
I want the complete Prisma schema defined and migrated against a running PostgreSQL instance,
So that all subsequent features have a stable, correct data model to build against.

**Acceptance Criteria:**

**Given** the postgres Docker service is running and `DATABASE_URL` is set in `.env`
**When** `npx prisma migrate dev --name init` is run
**Then** all required models are created: User, Account, Session, VerificationToken (NextAuth standard models), Workspace, WorkspaceMember, Channel, Message, InviteToken
**And** `WorkspaceMember` has `@@unique([userId, workspaceId])` and `@@index([workspaceId])`
**And** `Channel` has `@@unique([workspaceId, name])` and `@@index([workspaceId])`
**And** `Message` has `@@index([channelId, createdAt(sort: Desc)])`
**And** `MemberRole` enum exists with values `ADMIN` and `MEMBER`; `WorkspaceMember.role` defaults to `MEMBER`
**And** `User.password` is nullable (null for OAuth-only users)
**And** `npx prisma validate` exits 0
**And** `npx prisma generate` exits 0 and the generated Prisma Client is importable in TypeScript without type errors

### Story 1.4: Socket.io Server Scaffold

As a developer,
I want a scaffolded Socket.io server with directory structure, Redis adapter wiring, auth middleware stub, and Docker configuration,
So that real-time feature stories have a working server process to build on.

**Acceptance Criteria:**

**Given** Redis is running and `REDIS_URL` is set in `.env`
**When** the Socket.io server starts via `npm run dev` (concurrently with Next.js)
**Then** the server starts on port 3001 without errors and logs a ready message
**And** `server/index.ts` initializes Socket.io with `createAdapter` from `@socket.io/redis-adapter` connected to Redis using `ioredis`
**And** CORS is configured to allow requests only from the value of `NEXTAUTH_URL` (not wildcard)
**And** `server/middleware/auth.ts` exports an `authMiddleware` function that reads the `next-auth.session-token` cookie — it may return `next(new Error("Unauthorized"))` for all connections as a stub at this stage
**And** `server/handlers/message.ts` and `server/handlers/channel.ts` exist as exported stub functions
**And** `server/Dockerfile` builds the server into a runnable Node.js image using `tsx`
**And** the `socket-server` service is added to `docker-compose.yml` depending on `redis` and `postgres`

### Story 1.5: User Registration with Email/Password

As a new user,
I want to create an account with my email address and password,
So that I can access the application.

**Acceptance Criteria:**

**Given** a user navigates to `/sign-up`
**When** they submit a valid email and a password of at least 8 characters
**Then** a new `User` record is created in the database with the password hashed using bcrypt at cost factor ≥ 12
**And** the user is redirected to `/sign-in` with a success message
**And** submitting an email already in use returns a 409 response: `{ error: "Email already registered", code: "CONFLICT" }`
**And** submitting a password shorter than 8 characters returns a 400 response: `{ error: "Password too short", code: "VALIDATION_ERROR" }` — no DB write occurs
**And** `POST /api/auth/register` is rate-limited to 10 requests per minute per IP (NFR10)
**And** the sign-up form has proper `<label>` elements for all inputs, error messages are in an `aria-live` region, and the form is fully keyboard-navigable (NFR16–17)

### Story 1.6: User Sign-In & Session Persistence

As a registered user,
I want to sign in with my email and password and stay signed in across browser refreshes,
So that I don't need to re-authenticate every time I open the app.

**Acceptance Criteria:**

**Given** a user has a registered account
**When** they submit correct credentials on `/sign-in`
**Then** a database session record is created and a `next-auth.session-token` cookie is set with `HttpOnly`, `Secure`, and `SameSite=Lax` attributes (NFR7)
**And** the user is redirected to the authenticated app home (`/`)
**And** after a full browser refresh, the user is still authenticated (session persists — FR6)
**And** submitting incorrect credentials shows an error message and creates no session
**And** the sign-in form has proper labels, keyboard navigation, and accessible error messaging

### Story 1.7: GitHub OAuth Sign-In

As a developer or tech-savvy user,
I want to sign in with my GitHub account,
So that I can authenticate without creating a separate password.

**Acceptance Criteria:**

**Given** `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env` and the GitHub OAuth app is configured with the correct callback URL
**When** a user clicks "Continue with GitHub" on `/sign-in`
**Then** they are redirected to GitHub for authorization
**And** after approving, they are redirected back to the app; a `User` and `Account` record are created (or linked if the email already exists)
**And** a database session is created with the same `HttpOnly` cookie properties as email/password sessions
**And** the user lands on the authenticated app home (`/`)
**And** if the user cancels or GitHub returns an error, they return to `/sign-in` with an error message — no session is created

### Story 1.8: Route Protection & Sign-Out

As a user,
I want to be automatically redirected to sign-in when accessing protected routes without a valid session, and to be able to sign out securely,
So that my account is protected from unauthorized access.

**Acceptance Criteria:**

**Given** an unauthenticated user (no valid session cookie)
**When** they navigate to any route under `/(app)/` (e.g., `/workspace/[id]`, `/`)
**Then** they are immediately redirected to `/sign-in` by NextAuth middleware in `src/middleware.ts`
**And** `/sign-in`, `/sign-up`, `/invite/*`, and `/api/auth/*` are accessible without a session (not redirected)

**Given** an authenticated user
**When** they click "Sign out"
**Then** `signOut()` is called, the database session record is deleted, and the session cookie is cleared
**And** they are redirected to `/sign-in`
**And** navigating to a protected route immediately after redirects to `/sign-in` (session is fully invalidated)

---

## Epic 2: Workspace & Channel Management

Authenticated users can create workspaces, create public channels within them, navigate between workspaces, and view a workspace home — all workspace data is isolated; admins have a settings panel and can delete channels.

### Story 2.1: App Layout Shell

As an authenticated user,
I want a structured three-column app layout with workspace navigation, channel list, and main content area,
So that I can navigate the application intuitively on both desktop and mobile.

**Acceptance Criteria:**

**Given** an authenticated user accesses any page under `/(app)/`
**When** the page renders
**Then** on desktop (≥1280px): a three-column layout is displayed — workspace/nav sidebar on the left, channel list in the center-left, and main content area on the right
**And** on mobile (<768px): the sidebar collapses; a drawer toggle opens workspace and channel navigation; the main panel fills the screen; no horizontal scroll occurs
**And** all interactive layout elements (drawer toggle, sidebar links) are keyboard-navigable with visible focus indicators (NFR17)
**And** UI colour contrast meets WCAG AA minimums: 4.5:1 for normal text, 3:1 for large text and icons (NFR19)
**And** the layout is implemented in `src/app/(app)/layout.tsx` and wraps all authenticated workspace/channel pages

### Story 2.2: Workspace Creation Flow

As an authenticated user,
I want to create a new workspace with a name,
So that I have an organized space for my team.

**Acceptance Criteria:**

**Given** an authenticated user with no existing workspaces, or any user who initiates workspace creation
**When** they submit a workspace name in the Create Workspace dialog
**Then** `POST /api/workspaces` creates a new `Workspace` record and a `WorkspaceMember` record for the creator with `role = ADMIN` (FR8)
**And** `requireAuth()` is called first; an unauthenticated request returns 401 `{ error: "Unauthorized", code: "UNAUTHORIZED" }`
**And** the user is redirected to `/workspace/[newWorkspaceId]` on success
**And** submitting an empty workspace name returns 400 `{ error: "Name is required", code: "VALIDATION_ERROR" }` — no DB write occurs
**And** a user with no workspaces sees a "Create your first workspace" prompt when they land on `/` (app home)
**And** the `CreateWorkspaceDialog` component uses a Shadcn/ui Dialog with a name input field (UX-DR9)

### Story 2.3: Workspace Home Screen & Multi-Workspace Navigation

As a workspace member,
I want to see a workspace home screen and switch between workspaces I belong to,
So that I can navigate to the right context quickly.

**Acceptance Criteria:**

**Given** an authenticated user who belongs to one or more workspaces
**When** they navigate to `/workspace/[workspaceId]`
**Then** `requireWorkspaceMember(userId, workspaceId)` is called; a non-member receives 403 `{ error: "Forbidden", code: "FORBIDDEN" }` (FR30)
**And** the workspace home page displays the workspace name and a prompt to select a channel from the sidebar
**And** `GET /api/workspaces` returns only the workspaces the authenticated user is a member of (no cross-workspace data leakage — FR30)
**And** the workspace switcher in the sidebar lists all user workspaces; clicking one navigates to `/workspace/[id]`
**And** navigating to `/` redirects to the user's first workspace, or to workspace creation if the user has no memberships
**And** `GET /api/workspaces/[id]` returns 404 if the workspace does not exist, 403 if the user is not a member

### Story 2.4: Channel Creation & Sidebar Navigation

As a workspace member,
I want to create public channels and navigate between them in a sidebar list,
So that I can organize team conversations by topic.

**Acceptance Criteria:**

**Given** an authenticated workspace member
**When** they open a workspace
**Then** `GET /api/workspaces/[id]/channels` returns all channels in that workspace; `requireAuth()` + `requireWorkspaceMember()` are called first — a non-member receives 403 (FR30, FR32)
**And** the channel list is displayed in the sidebar within the workspace layout (FR13)

**Given** a workspace member submits a new channel name in the Create Channel dialog
**When** `POST /api/workspaces/[id]/channels` is called
**Then** a new `Channel` record is created with the given name and optional description
**And** `requireAuth()` + `requireWorkspaceMember()` are called first — unauthenticated → 401, non-member → 403
**And** submitting a channel name already used in the workspace returns 409 `{ error: "Channel name already exists", code: "CONFLICT" }` (enforced by `@@unique([workspaceId, name])`)
**And** submitting an empty channel name returns 400 `VALIDATION_ERROR`
**And** the `CreateChannelDialog` is a Shadcn/ui Dialog with name (required) and description (optional) fields (UX-DR8)

**Given** a member clicks a channel in the sidebar
**When** they are on the workspace page
**Then** they navigate to `/workspace/[id]/channel/[channelId]` and the channel header displays the channel name (FR14)

### Story 2.5: Workspace Settings Panel & Channel Admin Controls

As a workspace admin,
I want access to a settings panel where I can view workspace details and delete channels,
So that I can keep the workspace organized.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/workspace/[id]/settings`
**When** the page loads
**Then** `requireWorkspaceMember()` is called; the returned member's `role` is checked — a user with `MEMBER` role sees a 403 error or is redirected away; only `ADMIN` role users can view and interact with the settings panel (FR11, FR33)

**Given** an admin is on the workspace settings page
**When** they view the settings panel
**Then** the workspace name is displayed and a list of all channels is shown with a delete button beside each (FR11)
**And** clicking delete shows a confirmation dialog: "Delete #channel-name? All messages will be permanently removed. This cannot be undone."
**And** confirming sends `DELETE /api/workspaces/[id]/channels/[channelId]`; `requireAuth()` + `requireWorkspaceMember()` are called and role is verified — a `MEMBER` attempting this receives 403 (FR15, FR33)
**And** the channel and all its messages are deleted (cascade); the channel disappears from the sidebar for all users
**And** attempting to delete a non-existent channel returns 404 `NOT_FOUND`
**And** the workspace settings link in the sidebar is visible only to users with `ADMIN` role

---

## Epic 3: Membership & Invitations

Admins can generate shareable invite links; new users can sign up and land directly in the workspace from that link; admins can view the member list and remove members with immediate effect.

### Story 3.1: Invite Link Generation & Display

As a workspace admin,
I want to generate a shareable invite link for my workspace,
So that I can onboard new team members without sending individual email invitations.

**Acceptance Criteria:**

**Given** an admin is on the workspace settings page
**When** they click "Generate invite link"
**Then** `POST /api/workspaces/[id]/invite-tokens` creates a new `InviteToken` record with a unique `token` (cuid)
**And** `requireAuth()` + `requireWorkspaceMember()` are called; role is verified — a `MEMBER` attempting this receives 403 (FR33)
**And** the generated invite URL is displayed in the format `[NEXTAUTH_URL]/invite/[token]` (UX-DR6)
**And** a "Copy link" button copies the URL to the clipboard and shows a brief "Copied!" confirmation
**And** if an invite token already exists for the workspace, the settings page displays it without requiring regeneration on every load (`GET /api/workspaces/[id]/invite-tokens` returns existing tokens, admin-only)
**And** clicking "Regenerate" creates a new `InviteToken`; the new link is displayed immediately; previous tokens remain valid in the database (no revocation at MVP)

### Story 3.2: Invite-Aware Join Flow

As anyone with a valid invite link,
I want to join a workspace by clicking the link and completing a one-step signup or sign-in,
So that I can start messaging my team with minimal friction.

**Acceptance Criteria:**

**Given** a user navigates to `/invite/[token]`
**When** the page loads
**Then** the token is validated against the `InviteToken` table; an invalid or missing token shows an error page: "This invite link is invalid or has expired"
**And** a valid token displays the workspace name prominently so the user knows what they are joining (FR17)

**Given** the token is valid and the user is unauthenticated
**When** they complete the sign-up form shown on `/invite/[token]`
**Then** `POST /api/auth/register` creates the user account
**And** a `WorkspaceMember` record is created for the new user with `role = MEMBER` in the associated workspace immediately upon registration — no separate join step (FR18)
**And** the user is redirected to `/workspace/[workspaceId]` and all workspace channels are visible in the sidebar (FR17)
**And** the `/invite/[token]` route is rate-limited to 10 requests per minute per IP (NFR10)

**Given** the token is valid and the user is already authenticated
**When** they land on `/invite/[token]`
**Then** a "Join [workspace name]" button is displayed
**And** clicking it creates a `WorkspaceMember` record (if one does not already exist) and redirects to the workspace
**And** if the user is already a member, they are redirected to the workspace without creating a duplicate record

### Story 3.3: Member List View

As a workspace member,
I want to see the full list of members in my workspace,
So that I know who's on my team and what their roles are.

**Acceptance Criteria:**

**Given** an authenticated workspace member navigates to the workspace settings page
**When** the member list section loads
**Then** `GET /api/workspaces/[id]/members` returns all `WorkspaceMember` records joined with user data (name, email, role, joinedAt)
**And** `requireAuth()` + `requireWorkspaceMember()` are called without a role check — all members (ADMIN and MEMBER) can view the list (FR19, NFR11)
**And** only members of the specified workspace are returned — no data from other workspaces leaks (FR30, NFR11)
**And** each row in the member list shows: display name, email, role badge ("Admin" or "Member"), and join date
**And** the workspace settings page is accessible to all workspace members; admin-only sections (invite link, channel deletion) render conditionally based on the current user's role
**And** the member list is accessible: table has proper ARIA roles or uses semantic HTML; role badges have sufficient colour contrast (NFR16–19)

### Story 3.4: Member Removal & Immediate Access Revocation

As a workspace admin,
I want to remove a member from the workspace,
So that their access is revoked immediately when they leave the team.

**Acceptance Criteria:**

**Given** an admin views the member list and clicks "Remove" beside a member
**When** they confirm the action in the dialog "Remove [name] from [workspace name]?"
**Then** `DELETE /api/workspaces/[id]/members/[userId]` deletes the `WorkspaceMember` record
**And** `requireAuth()` + `requireWorkspaceMember()` are called; role is verified — a `MEMBER` attempting removal receives 403 (FR20, FR33)
**And** attempting to remove a user who is not a member returns 404 `NOT_FOUND`
**And** an admin attempting to remove themselves returns 400 `{ error: "Cannot remove yourself", code: "VALIDATION_ERROR" }`
**And** on success, the removed member disappears from the member list without a full page reload

**Given** a member has been removed
**When** they make any subsequent request to a workspace-scoped API route (any route calling `requireWorkspaceMember`)
**Then** `requireWorkspaceMember` returns no record and throws `"FORBIDDEN"` → the response is 403 — access is revoked immediately, without any cache TTL or delay (FR21)
**And** this works because sessions are database-backed: the removed user's session cookie is still valid but `requireWorkspaceMember` now blocks all workspace data access
**And** the removed user navigating to the workspace in their browser tab will receive a 403 and be shown an "Access denied" message or redirected to `/`
**And** remove buttons in the member list are only visible to users with `ADMIN` role (UX-DR7, FR33)

---

## Epic 4: Real-Time Messaging & History

Team members can send text messages in channels, receive new messages instantly without refresh, scroll back through complete unlimited message history, and have the connection silently recover after drops with missed messages delivered automatically.

### Story 4.1: Socket.io Authentication & Room Management

As a developer,
I want the Socket.io server to authenticate connections using NextAuth sessions and place users into the correct channel rooms,
So that real-time message delivery is scoped correctly and unauthenticated connections are rejected before any data exchange.

**Acceptance Criteria:**

**Given** a client connects to the Socket.io server on port 3001
**When** the connection handshake occurs
**Then** `server/middleware/auth.ts` reads the `next-auth.session-token` cookie from `socket.handshake.headers.cookie`, validates it against the NextAuth `Session` table via Prisma, and calls `next(new Error("Unauthorized"))` if no valid session is found — the socket is disconnected before joining any room (FR31, NFR9)
**And** on successful auth, `socket.data.userId` is set to the authenticated user's ID
**And** the event payload types are defined in `src/types/socket.ts` before any handler is written:
- `MessageNewPayload`: `{ id, content, channelId, workspaceId, userId, userName, createdAt }`
- `ServerToClientEvents`: `"message:new"`, `"member:removed"`
- `ClientToServerEvents`: `"message:send"`, `"channel:join"`

**Given** an authenticated socket connection
**When** the user opens a channel (client emits `"channel:join"` with `{ channelId, workspaceId }`)
**Then** `server/handlers/channel.ts` verifies the user is a member of the workspace (via Prisma `requireWorkspaceMember`); non-members receive an error event and are not joined to the room
**And** on successful membership check, the socket joins room `"channel:{channelId}"`
**And** unauthenticated connections attempting to emit any event receive an error and are not processed (NFR9)

### Story 4.2: Message Send & Real-Time Broadcast

As a workspace member,
I want to send a text message in a channel and have it appear instantly for all connected members,
So that the conversation feels live and immediate.

**Acceptance Criteria:**

**Given** an authenticated member has a channel open and a Socket.io connection established
**When** they type a message and press Enter in the `MessageComposer` input
**Then** the client emits `"message:send"` with `{ content, channelId, workspaceId }` to the Socket.io server
**And** `server/handlers/message.ts` verifies the user is a workspace member (via Prisma); a non-member's event is dropped with an error response
**And** `createMessage()` in `src/server/db/message.ts` writes the message to PostgreSQL and returns the saved record with the user's name — the DB write is confirmed before any broadcast (FR22, NFR20)
**And** `io.to("channel:{channelId}").emit("message:new", payload)` broadcasts to all connected clients in the channel room, including the sender (FR23)
**And** `SocketProvider` on the client side listens for `"message:new"` and calls `store.appendMessage(channelId, message)` — the message appears in the list only upon receipt of this server event (no optimistic update)
**And** the Zustand store shape is defined in `src/store/workspace-store.ts`: `{ activeChannelId, messages: Record<string, Message[]>, appendMessage, prependMessages, setActiveChannel }`
**And** message delivery latency from send to all connected same-region clients is <200ms at p95 under normal load (NFR1)
**And** `MessageComposer` sends on Enter; Shift+Enter inserts a newline; the input is a controlled textarea that expands with content (UX-DR10)
**And** submitting an empty message is a no-op (no emit, no error)

### Story 4.3: Message History Display

As a workspace member,
I want to see the last 50 messages when I open a channel, with each message showing the sender's name and timestamp,
So that I have immediate context for the ongoing conversation.

**Acceptance Criteria:**

**Given** an authenticated member navigates to `/workspace/[id]/channel/[channelId]`
**When** the channel page loads
**Then** the RSC (`channel/[channelId]/page.tsx`) calls `getMessages({ channelId, take: 50 })` from `src/server/db/message.ts`, which queries with the composite index `[channelId, createdAt(sort: Desc)]` and returns the 50 most recent messages
**And** `requireWorkspaceMember` is called before any message fetch — non-members receive a 403 page (FR32)
**And** the Zustand store is hydrated with the fetched messages; subsequent real-time updates append to this initial set
**And** the `MessageList` component renders messages with the oldest at the top and newest at the bottom; the view is scrolled to the bottom on initial load (UX-DR3)
**And** each `MessageItem` displays: sender display name, message content, and formatted send timestamp (FR29)
**And** the initial 50-message history loads within 500ms on broadband connections (NFR2)
**And** full message history is available — there is no truncation by age, count, or tier; the pagination mechanism (Story 4.4) provides access to all older messages (FR26, FR28)
**And** when a new `"message:new"` event arrives and the user is scrolled to (or near) the bottom, the list auto-scrolls to show the new message (UX-DR4)
**And** when the user is scrolled up and a new message arrives, a "New messages ↓" indicator appears; clicking it scrolls to the bottom (UX-DR4)

### Story 4.4: Cursor-Based Message Pagination

As a workspace member,
I want to scroll upward in a channel to load older messages incrementally,
So that I can access the complete conversation history without loading everything at once.

**Acceptance Criteria:**

**Given** a member is viewing a channel with more than 50 messages
**When** they scroll to the top of the `MessageList`
**Then** the client sends `GET /api/channels/[id]/messages?cursor=[oldestVisibleMessageId]&take=50`
**And** `requireAuth()` + `requireWorkspaceMember()` are called on this route; non-members receive 403
**And** `getMessages({ channelId, cursor, take: 50 })` fetches the 50 messages before the cursor using Prisma cursor pagination (`skip: 1, cursor: { id: cursor }, take: -50` or equivalent); results are ordered oldest-first
**And** `store.prependMessages(channelId, olderMessages)` adds the older messages above the current list in Zustand
**And** scroll position is preserved after prepend — the user is not jumped to the top (UX-DR3)
**And** a loading indicator is shown while the fetch is in progress
**And** when no older messages exist, the fetch returns an empty array and no further scroll fetch is triggered
**And** the route returns messages in the same shape as the initial load: `{ id, content, userId, userName, channelId, createdAt }`

### Story 4.5: WebSocket Reconnection & Missed Message Recovery

As a workspace member,
I want the app to silently reconnect to real-time updates after a network interruption and deliver any messages I missed,
So that I never need to manually refresh to get back in sync.

**Acceptance Criteria:**

**Given** a member has an active Socket.io connection
**When** the connection drops (network interruption, sleep, etc.)
**Then** the Socket.io client in `SocketProvider` automatically attempts reconnection with exponential backoff; the connection is re-established within 3 seconds of network recovery without any user action (FR24, NFR4)

**Given** the socket reconnects (the `"connect"` event fires)
**When** `SocketProvider` handles the reconnect
**Then** it reads `activeChannelId` and the last message ID for that channel from the Zustand store
**And** if there is an active channel with at least one message, it fetches `GET /api/channels/[activeChannelId]/messages?after=[lastMessageId]` to retrieve missed messages
**And** the missed messages are inserted into the Zustand store in order, filling the gap between the last known message and the current state (FR25)
**And** `GET /api/channels/[id]/messages?after=[messageId]` is a supported query parameter on the existing messages route — it returns all messages with `createdAt` after the specified message's `createdAt`, ordered ascending, capped at 200 (sufficient for typical disconnect durations)
**And** if the store is empty (first connect, not a reconnect), no missed message fetch is triggered

### Story 4.6: Connection Status Indicator & Graceful Degradation

As a workspace member,
I want a visible indicator when real-time connectivity is lost, and to keep reading message history while disconnected,
So that I always know the state of my connection and am never surprised by missed updates.

**Acceptance Criteria:**

**Given** the Socket.io connection drops or fails to connect
**When** the `SocketProvider` detects the disconnection
**Then** a `ConnectionStatusBar` component becomes visible at the top or bottom of the message area showing "Reconnecting…" or "Disconnected — check your connection" (UX-DR5, NFR21)
**And** the status indicator distinguishes between "reconnecting" (transient) and "disconnected" (persistent failure after max retries)

**Given** the WebSocket server is unreachable
**When** a member views a channel
**Then** previously loaded message history in the Zustand store remains visible and readable — the app does not blank out or crash (NFR21)
**And** the `MessageComposer` is disabled with a tooltip: "You're offline — reconnect to send messages"
**And** no message send events are emitted while the socket is disconnected

**Given** the connection is restored
**When** the socket reconnects
**Then** the `ConnectionStatusBar` disappears (or briefly shows "Connected") and the composer is re-enabled
**And** missed message recovery (Story 4.5) runs automatically on reconnect
