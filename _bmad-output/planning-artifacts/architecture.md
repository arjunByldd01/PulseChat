---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-05-03'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
workflowType: 'architecture'
project_name: 'slack-clone'
user_name: 'Arjun'
date: '2026-05-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 33 FRs across 7 capability areas

| Capability Area | FR Count | Architectural Weight |
|---|---|---|
| User Auth & Session Management | 6 | Medium — NextAuth.js, OAuth, session persistence |
| Workspace Management | 5 | Low-Medium — multi-tenant data model, RBAC seed |
| Channel Management | 4 | Low — CRUD + sidebar state |
| Membership & Invitations | 6 | Medium — invite token lifecycle, immediate access revocation |
| Real-Time Messaging | 4 | **High** — WebSocket server, room management, reconnection |
| Message History & Persistence | 4 | Medium — paginated queries, permanent storage, write-before-broadcast |
| Access Control & Data Isolation | 4 | **High** — workspace scoping at DB layer, WebSocket auth, RBAC |

**Non-Functional Requirements:** 22 NFRs — the binding quality contract

| Category | Key Constraint | Architectural Implication |
|---|---|---|
| Performance | <200ms message delivery p95 | Socket.io room broadcast, Redis pub/sub, no DB round-trip on receive |
| Performance | <500ms channel history load | Indexed queries, pagination, no N+1 |
| Performance | <2s TTI authenticated | SSR initial load, minimal client JS bundle |
| Security | WebSocket auth on handshake | Middleware layer before socket join; session validation before room entry |
| Security | HttpOnly cookies only | NextAuth.js session strategy: jwt or database session |
| Security | DB-layer workspace isolation | Prisma query middleware or repository pattern — no raw SQL without tenant scope |
| Scalability | Redis pub/sub for Socket.io | Socket.io adapter pattern; Redis required even for single-node to support future scale |
| Reliability | Persist before broadcast | Message write → DB confirm → emit to room; no optimistic broadcast |

**Scale & Complexity:**

- **Primary domain:** Real-time multi-tenant web application
- **Complexity level:** Medium — driven by WebSocket state management and multi-tenant isolation, not domain logic
- **Estimated architectural components:** 6 (Next.js app, NextAuth.js, Socket.io server, Redis, PostgreSQL/Prisma, shared types)

### Technical Constraints & Dependencies

- **Stack locked:** Next.js App Router, TypeScript, Prisma ORM, PostgreSQL, Shadcn/ui, TailwindCSS, NextAuth.js
- **WebSocket:** Socket.io + dedicated Node.js server — separate process from Next.js
- **No file uploads for MVP** — no object storage decision needed
- **No native mobile** — web-only
- **Deployment target:** Self-hosted via Docker Compose (local + production)

### Cross-Cutting Concerns Identified

1. **Authentication scope** — every HTTP request, WebSocket handshake, and Prisma query must be scoped to an authenticated user
2. **Workspace data isolation** — workspace ID threaded through every data access path; application-layer filtering alone is insufficient
3. **Real-time connection lifecycle** — connect → authenticate → join workspace rooms → handle disconnect; affects message delivery guarantees
4. **RBAC (admin vs member)** — two permission levels affect API routes, Socket.io event handlers, and UI components; must be consistent across layers
5. **Write-before-broadcast** — messages persisted and confirmed before emitting to Socket.io room
6. **Graceful degradation** — UI remains functional (read-only) when WebSocket server is unreachable

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Next.js web application — server-rendered initial load, client-side SPA behaviour post-auth, separate Socket.io server process for real-time.

### Starter Options Considered

| Starter | Provides | Missing |
|---|---|---|
| `create-next-app` | Next.js 15, TypeScript, Tailwind, App Router | Prisma, NextAuth (manual wiring — non-trivial) |
| `create-t3-app` | Next.js 15, TypeScript, Tailwind, Prisma, NextAuth, env validation | Shadcn/ui (one command post-init), tRPC (skipped) |

### Selected Starter: `create-t3-app` (T3 Stack, no tRPC)

**Rationale:** T3 pre-wires Prisma + NextAuth with Next.js App Router correctly — the single hardest part of initial setup. Getting `next-auth` session callbacks, Prisma client singleton, and App Router middleware working together without T3 takes significant effort with non-obvious pitfalls. tRPC skipped — standard Next.js Route Handlers are sufficient for our API surface.

**Initialization Commands:**

```bash
# 1. Create project
npm create t3-app@latest slack-clone
# Select: TypeScript ✓ | Tailwind ✓ | Prisma ✓ | NextAuth ✓ | tRPC ✗ | App Router ✓

# 2. Add Shadcn/ui
cd slack-clone
npx shadcn@latest init
# Select: Default style | CSS variables ✓ | src/app path

# 3. Add Socket.io + Redis adapter
npm install socket.io socket.io-client ioredis @socket.io/redis-adapter

# 4. Scaffold Socket.io server
mkdir server && touch server/index.ts
npm install -D tsx
```

**Architectural Decisions Provided by Starter:**

| Concern | Decision |
|---|---|
| Language & Runtime | TypeScript strict mode, Node.js 20+ |
| Framework | Next.js 15, App Router, React 19 |
| Styling | TailwindCSS v4, PostCSS |
| Auth | NextAuth.js v5 (Auth.js) pre-wired with App Router middleware |
| ORM | Prisma 6 with PostgreSQL adapter, client singleton pattern |
| Env validation | `@t3-oss/env-nextjs` — typed env vars, fails fast on missing config |
| Linting | ESLint + Prettier, TypeScript strict |
| Project structure | `src/` directory, `src/app/` for routes, `src/server/` for backend logic |

**Note:** Project initialization is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):**
- Prisma schema — data model for the entire app
- NextAuth session strategy — JWT vs database sessions
- WebSocket auth mechanism — how Socket.io validates users
- Message pagination strategy — cursor vs offset

**Important (shape architecture):**
- State management approach — Zustand vs React context
- API communication pattern — Route Handlers + Socket.io events
- Docker Compose service topology

**Deferred (post-MVP):**
- CDN/edge caching
- Full-text search indexing (PostgreSQL `tsvector`)
- Horizontal Next.js scaling

### Data Architecture

**Prisma Schema:**

```prisma
model User {
  id            String            @id @default(cuid())
  name          String?
  email         String            @unique
  emailVerified DateTime?
  image         String?
  password      String?           // null for OAuth users
  createdAt     DateTime          @default(now())
  accounts      Account[]
  sessions      Session[]
  memberships   WorkspaceMember[]
  messages      Message[]
}

model Workspace {
  id           String            @id @default(cuid())
  name         String
  slug         String            @unique
  createdAt    DateTime          @default(now())
  members      WorkspaceMember[]
  channels     Channel[]
  inviteTokens InviteToken[]
}

model WorkspaceMember {
  id          String     @id @default(cuid())
  userId      String
  workspaceId String
  role        MemberRole @default(MEMBER)
  joinedAt    DateTime   @default(now())
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@unique([userId, workspaceId])
  @@index([workspaceId])
}

enum MemberRole { ADMIN MEMBER }

model Channel {
  id          String    @id @default(cuid())
  name        String
  description String?
  workspaceId String
  createdAt   DateTime  @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  messages    Message[]
  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model Message {
  id        String   @id @default(cuid())
  content   String
  channelId String
  userId    String
  createdAt DateTime @default(now())
  channel   Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  @@index([channelId, createdAt(sort: Desc)])
}

model InviteToken {
  id          String    @id @default(cuid())
  token       String    @unique @default(cuid())
  workspaceId String
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@index([token])
}

// NextAuth required models (Account, Session, VerificationToken) generated by T3
```

**Pagination:** Cursor-based for messages — `cursor: messageId`, `take: 50`. Offset drifts as new messages arrive; cursor is stable for real-time chat.

**Caching:** No additional cache layer for MVP — PostgreSQL with indexes is sufficient. Redis already in stack for Socket.io.

### Authentication & Security

**Session strategy:** Database sessions (not JWT). Database sessions are immediately revocable — required for FR21 (removed members lose access instantly). JWT sessions cannot be invalidated without a denylist.

**Route protection:** NextAuth v5 middleware (`src/middleware.ts`) protects all routes except `/api/auth/*`, `/sign-in`, `/sign-up`, `/invite/*`.

**WebSocket auth:** On Socket.io handshake, validate `next-auth.session-token` cookie against NextAuth session table via Prisma. Invalid session → `socket.disconnect()` before any room join.

```typescript
io.use(async (socket, next) => {
  const sessionToken = parseCookie(socket.handshake.headers.cookie);
  const session = await validateNextAuthSession(sessionToken);
  if (!session) return next(new Error("Unauthorized"));
  socket.data.userId = session.userId;
  next();
});
```

**Rate limiting:** `express-rate-limit` on Socket.io HTTP server; Next.js middleware for API routes (in-memory for MVP, Redis-backed post-MVP).

### API & Communication Patterns

**HTTP API:** Next.js Route Handlers (`src/app/api/`) — REST-style for all CRUD (workspaces, channels, members, invite tokens, message history fetch).

**Real-time:** Socket.io events. Naming convention: `message:send`, `message:new`, `channel:join`, `workspace:member-removed`.

**Socket.io room strategy:**
- Per-channel room: `channel:{channelId}`
- Per-workspace room: `workspace:{workspaceId}` (member join/remove events)
- On connect: user joins all channel rooms for their workspace

**Error shape:** Consistent `{ error: string, code: string }` from all Route Handlers and Socket.io error events.

**No GraphQL, no tRPC** — Route Handlers sufficient for this API surface.

### Frontend Architecture

**State management:** Zustand — one store for active workspace state (current channel, messages, online members). RSCs handle initial server data; Zustand manages real-time updates. No Redux.

**Socket.io client:** Single `SocketProvider` context wrapping the authenticated app; exposes `useSocket()` hook. One connection per session.

**Component structure:** Shadcn/ui primitives composed into feature components under `src/components/`: `workspace/`, `channel/`, `message/`, `auth/`.

**Key client data flows:**
1. Channel open → RSC fetches last 50 messages → hydrates Zustand
2. `message:new` Socket.io event → append to Zustand store → re-render list
3. Scroll to top → cursor pagination fetch → prepend to store

### Infrastructure & Deployment

**Docker Compose (4 services):**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  web:
    build: .
    ports: ["3000:3000"]
    depends_on: [postgres, redis]

  socket-server:
    build: { context: ., dockerfile: server/Dockerfile }
    ports: ["3001:3001"]
    depends_on: [redis, postgres]
```

**Environment variables:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SOCKET_SERVER_URL`

### Decision Impact Analysis

**Implementation sequence:**
1. Project init (T3 + Shadcn + deps)
2. Docker Compose + env setup
3. Prisma schema + first migration
4. NextAuth config (credentials + GitHub)
5. Socket.io server with auth middleware
6. Core API routes
7. Real-time messaging (rooms + Zustand)
8. UI components

**Cross-component dependencies:**
- Prisma schema must be final before API routes or Socket.io handlers
- NextAuth must be wired before any protected routes or WebSocket auth
- Redis must be running before Socket.io server starts
- Define Socket.io event payload types before Zustand store shape

## Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 6 areas where agents will make different choices without explicit rules.

### Naming Patterns

**File & Directory Naming:**
```
# React components → PascalCase
src/components/workspace/WorkspaceSidebar.tsx  ✅
src/components/workspace/workspace-sidebar.tsx ❌

# All other files → kebab-case
src/lib/socket-client.ts      ✅
src/lib/socketClient.ts       ❌

# API route directories → kebab-case (Next.js convention)
src/app/api/invite-tokens/route.ts  ✅
src/app/api/inviteTokens/route.ts   ❌
```

**TypeScript Naming:**
```typescript
// Interfaces → PascalCase, no "I" prefix
interface WorkspaceMember { ... }   ✅
interface IWorkspaceMember { ... }  ❌

// Types → PascalCase
type MemberRole = "ADMIN" | "MEMBER"

// Functions → camelCase
function getWorkspaceById() {}   ✅

// Constants → SCREAMING_SNAKE_CASE
const MAX_MESSAGES_PER_PAGE = 50
```

**API Route Naming:** Plural nouns, kebab-case.
```
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:workspaceId
GET    /api/workspaces/:workspaceId/channels
POST   /api/workspaces/:workspaceId/channels
GET    /api/workspaces/:workspaceId/members
DELETE /api/workspaces/:workspaceId/members/:userId
POST   /api/workspaces/:workspaceId/invite-tokens
GET    /api/channels/:channelId/messages
POST   /api/auth/register
```

**Socket.io Event Naming:** `noun:verb` pattern, kebab-case nouns.
```typescript
// Client → Server
"message:send"    // user sends a message
"channel:join"    // user opens a channel

// Server → Client
"message:new"     // new message broadcast
"member:joined"   // new member joined workspace
"member:removed"  // member was removed
"error"           // standard Socket.io error
```

**Prisma/Database:** Model names PascalCase. Column names camelCase in schema — Prisma maps to `snake_case` in PostgreSQL automatically.

### Structure Patterns

**Project Layout:**
```
src/
  app/
    (auth)/                         # unauthenticated pages
      sign-in/page.tsx
      sign-up/page.tsx
    (app)/                          # authenticated layout
      workspace/[workspaceId]/
        channel/[channelId]/page.tsx
    api/
      workspaces/route.ts
      workspaces/[workspaceId]/channels/route.ts
      workspaces/[workspaceId]/members/route.ts
      workspaces/[workspaceId]/invite-tokens/route.ts
      channels/[channelId]/messages/route.ts
      auth/register/route.ts
  components/
    auth/
    workspace/
    channel/
    message/
    ui/                             # Shadcn/ui primitives
  lib/
    db.ts                           # Prisma client singleton
    auth.ts                         # NextAuth config export
    socket-client.ts                # Socket.io client singleton
    utils.ts                        # cn() + shared helpers
  server/
    auth.ts                         # requireAuth() helper
    db/                             # Data access layer
      workspace.ts
      channel.ts
      message.ts
      member.ts
  store/
    workspace-store.ts              # Zustand store
  types/
    socket.ts                       # Socket.io event payload types
    api.ts                          # Shared API types

server/                             # Socket.io server (separate process)
  index.ts
  middleware/auth.ts
  handlers/message.ts
  handlers/channel.ts
```

**Rule:** Prisma queries live only in `src/server/db/*.ts`. Route Handlers and components call these functions — never write Prisma queries inline.

**Tests:** Co-located `*.test.ts` / `*.test.tsx`. E2E tests in `tests/e2e/` using Playwright.

### Format Patterns

**API Response Shape — direct, no wrapper:**
```typescript
// ✅ Success
return NextResponse.json(workspace, { status: 200 })

// ✅ Error — always this shape
return NextResponse.json(
  { error: "Workspace not found", code: "NOT_FOUND" },
  { status: 404 }
)

// ❌ Never wrap success responses
return NextResponse.json({ data: workspace, success: true })
```

**Standard error codes:** `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`

**Dates:** ISO 8601 strings in all API responses. Never Unix timestamps.

**Socket.io event payload types (defined in `src/types/socket.ts` before any handler is written):**
```typescript
interface MessageNewPayload {
  id: string
  content: string
  channelId: string
  workspaceId: string
  userId: string
  userName: string
  createdAt: string  // ISO string
}

interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void
  "member:removed": (payload: { userId: string; workspaceId: string }) => void
}

interface ClientToServerEvents {
  "message:send": (payload: { content: string; channelId: string; workspaceId: string }) => void
}
```

### Communication Patterns

**Zustand store shape:**
```typescript
interface WorkspaceStore {
  activeChannelId: string | null
  messages: Record<string, Message[]>  // keyed by channelId
  members: WorkspaceMember[]
  setActiveChannel: (channelId: string) => void
  appendMessage: (channelId: string, message: Message) => void
  prependMessages: (channelId: string, messages: Message[]) => void
  removeMember: (userId: string) => void
}
```

**No optimistic updates for messages.** Client appends to Zustand only on receiving `message:new` from server — including for the sender. Ensures all clients share identical message state.

**Loading states:** React Suspense + `loading.tsx` for page-level. Local `useState` for component-level async actions. No global loading state in Zustand.

### Process Patterns

**Auth guard — every Route Handler:**
```typescript
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)  // throws "UNAUTHORIZED" if no session
    // ... handler logic
  } catch (e) {
    if (e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    return NextResponse.json({ error: "Internal error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
```

**Workspace membership guard — every workspace-scoped handler:**
```typescript
// src/server/db/workspace.ts
export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  })
  if (!member) throw new Error("FORBIDDEN")
  return member
}
```

### Enforcement Guidelines

**All agents MUST:**
- Put Prisma queries in `src/server/db/*.ts` — never inline
- Start every Route Handler with `requireAuth()` and workspace routes with `requireWorkspaceMember()`
- Use `{ error, code }` shape for all API errors
- Define Socket.io payload types in `src/types/socket.ts` before implementing handlers
- Never optimistically append messages — wait for `message:new` event from server
- Use `cuid()` for all entity IDs (set in Prisma schema)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
slack-clone/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── .env                          # local dev (gitignored)
├── .env.example                  # committed template
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile                    # Next.js app
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── server/                       # Socket.io server (separate Node.js process)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts                  # io setup, Redis adapter
│   ├── middleware/
│   │   └── auth.ts               # NextAuth session validation on handshake
│   └── handlers/
│       ├── message.ts            # message:send → persist → emit message:new
│       └── channel.ts            # channel:join → socket.join(room)
│
├── src/
│   ├── middleware.ts             # NextAuth route protection
│   │
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── invite/[token]/page.tsx
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx                              # redirect to first workspace
│   │   │   └── workspace/[workspaceId]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx                          # workspace home
│   │   │       ├── settings/page.tsx                 # members, invite link
│   │   │       └── channel/[channelId]/
│   │   │           ├── page.tsx
│   │   │           └── loading.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts
│   │       ├── workspaces/
│   │       │   ├── route.ts
│   │       │   └── [workspaceId]/
│   │       │       ├── route.ts
│   │       │       ├── channels/route.ts
│   │       │       ├── members/route.ts
│   │       │       ├── members/[userId]/route.ts
│   │       │       └── invite-tokens/route.ts
│   │       └── channels/[channelId]/messages/route.ts
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn/ui (do not edit manually)
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── InviteJoinForm.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceSidebar.tsx
│   │   │   ├── WorkspaceSwitcher.tsx
│   │   │   ├── CreateWorkspaceDialog.tsx
│   │   │   └── WorkspaceSettingsView.tsx
│   │   ├── channel/
│   │   │   ├── ChannelList.tsx
│   │   │   ├── ChannelHeader.tsx
│   │   │   └── CreateChannelDialog.tsx
│   │   ├── message/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── MessageComposer.tsx
│   │   └── members/
│   │       ├── MemberList.tsx
│   │       └── InviteLinkPanel.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── auth.ts               # NextAuth config
│   │   ├── socket-client.ts      # Socket.io client singleton
│   │   └── utils.ts              # cn() + helpers
│   │
│   ├── server/
│   │   ├── auth.ts               # requireAuth()
│   │   └── db/
│   │       ├── workspace.ts      # requireWorkspaceMember, getWorkspace, createWorkspace
│   │       ├── channel.ts        # getChannels, createChannel, deleteChannel
│   │       ├── message.ts        # getMessages (cursor), createMessage
│   │       └── member.ts         # getMembers, removeMember, addMember
│   │
│   ├── store/
│   │   └── workspace-store.ts    # Zustand: messages, activeChannel, members
│   │
│   ├── types/
│   │   ├── socket.ts             # ServerToClientEvents, ClientToServerEvents
│   │   └── api.ts                # shared request/response types
│   │
│   └── providers/
│       ├── SocketProvider.tsx    # socket lifecycle, useSocket() hook
│       └── Providers.tsx         # composes Session + Socket providers
│
├── tests/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── workspace.spec.ts
│       ├── channel.spec.ts
│       └── fixtures/test-users.ts
│
└── public/
    └── favicon.ico
```

### Architectural Boundaries

| Boundary | Technology | Auth |
|---|---|---|
| Next.js pages | App Router RSC | NextAuth middleware |
| HTTP API | Route Handlers `/api/*` | `requireAuth()` per handler |
| WebSocket | Socket.io server :3001 | Session validation on handshake |
| Database | Prisma via `src/server/db/` | Always workspace-scoped |
| Redis | Socket.io adapter only | Internal |

### Requirements to Structure Mapping

| FR Category | Primary Location |
|---|---|
| Auth & Session (FR1–6) | `src/app/(auth)/`, `src/app/api/auth/`, `src/lib/auth.ts`, `src/server/auth.ts` |
| Workspace Management (FR7–11) | `src/app/(app)/workspace/`, `src/app/api/workspaces/`, `src/server/db/workspace.ts` |
| Channel Management (FR12–15) | `src/components/channel/`, `src/app/api/workspaces/[id]/channels/`, `src/server/db/channel.ts` |
| Membership & Invitations (FR16–21) | `src/app/(auth)/invite/`, `src/app/api/workspaces/[id]/invite-tokens/`, `src/server/db/member.ts` |
| Real-Time Messaging (FR22–25) | `server/handlers/message.ts`, `src/providers/SocketProvider.tsx`, `src/store/workspace-store.ts` |
| Message History (FR26–29) | `src/app/api/channels/[id]/messages/`, `src/server/db/message.ts`, `src/components/message/MessageList.tsx` |
| Access Control (FR30–33) | `src/server/auth.ts`, `src/server/db/workspace.ts`, `server/middleware/auth.ts` |

### Data Flow

**Sending a message:**
```
MessageComposer → emit "message:send"
  → server/handlers/message.ts (auth + membership check)
  → src/server/db/message.ts createMessage() [Prisma write]
  → io.to("channel:{channelId}").emit("message:new", payload)
  → SocketProvider receives "message:new"
  → store.appendMessage(channelId, message)
  → MessageList re-renders
```

**Loading channel history:**
```
channel/[channelId]/page.tsx (RSC)
  → src/server/db/message.ts getMessages({ channelId, take: 50 })
  → renders MessageList with initial messages
  → scroll up → GET /api/channels/[id]/messages?cursor=X
  → store.prependMessages(channelId, olderMessages)
```

**Invite flow:**
```
/invite/[token]/page.tsx
  → validate token → get workspaceId
  → unauthenticated: SignUpForm with workspace context
  → POST /api/auth/register → addMember to workspace
  → redirect to /workspace/[workspaceId]
```

## Architecture Validation Results

### Coherence Validation ✅

All technologies are mutually compatible. Next.js 15 + NextAuth.js v5 + Prisma 6 + PostgreSQL is the T3 stack's tested combination. Socket.io with `@socket.io/redis-adapter` + `ioredis` is the standard horizontal scaling pattern. Zustand works cleanly alongside React Server Components. No version conflicts identified.

Naming conventions, the data access layer pattern, and the auth guard pattern are consistent across all layers — HTTP API, Socket.io server, and database. The directory structure maps directly to the 7 FR categories with clean separation between authenticated/unauthenticated concerns.

### Requirements Coverage Validation ✅

**All 33 FRs covered:**

| FR Category | Coverage |
|---|---|
| Auth & Session (FR1–6) | NextAuth.js v5 + database sessions + middleware |
| Workspace Management (FR7–11) | Prisma schema + Route Handlers + workspace home |
| Channel Management (FR12–15) | `@@unique([workspaceId, name])` + CRUD routes + sidebar |
| Membership & Invitations (FR16–21) | InviteToken model + `/invite/[token]` + member removal API |
| Real-Time Messaging (FR22–25) | Socket.io rooms + `message:send` handler + Redis adapter |
| Message History (FR26–29) | Cursor pagination + `@@index([channelId, createdAt])` + no TTL |
| Access Control (FR30–33) | `requireWorkspaceMember()` + WebSocket handshake auth + `MemberRole` enum |

**All 22 NFRs covered:**

| NFR | Coverage |
|---|---|
| NFR1 (200ms delivery) | Room broadcast, no DB round-trip on receive path |
| NFR2 (500ms history) | Composite index `[channelId, createdAt(sort: Desc)]` |
| NFR3 (2s TTI) | RSC initial page render |
| NFR4 (3s reconnect) | Socket.io client auto-reconnect + missed message fetch on reconnect |
| NFR6–7 (bcrypt + HttpOnly) | Register route + NextAuth v5 database session cookies |
| NFR9 (WebSocket auth) | `server/middleware/auth.ts` before any room join |
| NFR11 (DB isolation) | `requireWorkspaceMember()` on every workspace-scoped query |
| NFR13–15 (Scalability) | Redis adapter; single-schema multi-tenant; 100 connections/instance |
| NFR16–19 (Accessibility) | Shadcn/ui WCAG 2.1 AA baseline |
| NFR20 (Persist before broadcast) | `createMessage()` → DB confirm → `io.to().emit()` sequence |
| NFR21 (Graceful degrade) | SocketProvider exposes connection status; history remains visible |
| NFR22 (Zero-downtime migrations) | `prisma migrate deploy` |

### Gap Analysis Results

**Important gap — FR25/NFR4 (missed message delivery on reconnection):** Socket.io auto-reconnect re-establishes the connection but does not deliver messages sent while the client was offline. Resolution: on `SocketProvider` reconnect event, read `lastMessageId` from Zustand and fetch missed messages via `GET /api/channels/[id]/messages?after=[lastId]`.

```typescript
socket.on("connect", () => {
  const { activeChannelId, messages } = useWorkspaceStore.getState()
  if (activeChannelId && messages[activeChannelId]?.length > 0) {
    const lastId = messages[activeChannelId].at(-1)?.id
    fetch(`/api/channels/${activeChannelId}/messages?after=${lastId}`)
      .then(r => r.json())
      .then(missed => store.prependMessages(activeChannelId, missed))
  }
})
```

**Minor — dev runner:** Add to root `package.json`:
```json
"dev": "concurrently \"next dev\" \"tsx watch server/index.ts\""
```

**Minor — Socket.io CORS:** Set `cors: { origin: process.env.NEXTAUTH_URL }` on the Socket.io server. In Docker, web service connects to `socket-server` by service name.

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Key Strengths:**
- T3 starter eliminates the hardest wiring (Prisma + NextAuth + App Router)
- Prisma schema is complete and migration-safe from day one
- Data access layer pattern prevents workspace isolation bugs
- Socket.io event types defined before implementation prevents payload mismatches

**Areas for Future Enhancement:**
- Redis-backed rate limiting (upgrade from in-memory post-MVP)
- Full-text search via PostgreSQL `tsvector` (Phase 2)
- Nginx reverse proxy for Socket.io in production (Phase 2)

### Implementation Handoff

**First implementation step:**
```bash
npm create t3-app@latest slack-clone
# Select: TypeScript ✓ | Tailwind ✓ | Prisma ✓ | NextAuth ✓ | tRPC ✗ | App Router ✓
cd slack-clone && npx shadcn@latest init
npm install socket.io socket.io-client ioredis @socket.io/redis-adapter concurrently
```

**AI Agent Guidelines:**
- Put Prisma queries only in `src/server/db/` — never inline
- Start every Route Handler with `requireAuth()`, workspace routes with `requireWorkspaceMember()`
- Define Socket.io payload types in `src/types/socket.ts` before writing handlers
- Never optimistically append messages — wait for `message:new` from server
- Refer to this document for all architectural questions
