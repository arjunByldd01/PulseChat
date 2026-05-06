# Epic 1 Context: Project Foundation & Authentication

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the complete technical foundation the rest of the project builds on: a running T3 stack (Next.js 15, Prisma, NextAuth.js v5, Tailwind, Shadcn/ui) with a separate Socket.io server process, Docker Compose for Postgres and Redis, the full Prisma schema migrated to the database, and all authentication flows working end-to-end (email/password signup, sign-in, GitHub OAuth, route protection, sign-out). Nothing in Epics 2–4 can begin until this epic is complete.

## Stories

- Story 1.1: Initialize T3 Project Stack
- Story 1.2: Docker Compose & Environment Configuration
- Story 1.3: Database Schema & First Migration
- Story 1.4: Socket.io Server Scaffold
- Story 1.5: User Registration with Email/Password
- Story 1.6: User Sign-In & Session Persistence
- Story 1.7: GitHub OAuth Sign-In
- Story 1.8: Route Protection & Sign-Out

## Requirements & Constraints

- Stack is locked: Next.js 15 App Router, TypeScript strict mode, Prisma 6 + PostgreSQL, NextAuth.js v5, Shadcn/ui, TailwindCSS v4, Socket.io + Redis adapter, Zustand.
- Use `create-t3-app` (no tRPC, App Router, TypeScript, Tailwind, Prisma, NextAuth selected). This pre-wires Prisma + NextAuth correctly — do not bootstrap manually.
- Add Shadcn/ui via `npx shadcn@latest init` after T3 init. Add Socket.io deps: `socket.io socket.io-client ioredis @socket.io/redis-adapter concurrently`. Add dev dep: `tsx`.
- Root `package.json` `dev` script must be: `"concurrently \"next dev\" \"tsx watch server/index.ts\""`.
- Auth uses **database sessions** (not JWT) — required for immediate session revocation when members are removed (FR21).
- Passwords hashed with bcrypt, minimum cost factor 12 (NFR6).
- Session tokens in HttpOnly, Secure cookies only — never localStorage (NFR7).
- All protected routes enforced via NextAuth v5 middleware at `src/middleware.ts`. Public paths: `/api/auth/*`, `/sign-in`, `/sign-up`, `/invite/*`.
- Auth API endpoints must respond within 500ms p95 (NFR5).
- Prisma schema must be finalized in Story 1.3 — all later stories depend on it. No schema changes after 1.3 without migration.

## Technical Decisions

**Project structure** — strict layout:
```
src/app/(auth)/         # sign-in, sign-up, invite pages
src/app/(app)/          # authenticated pages
src/app/api/auth/       # NextAuth + register route
src/components/auth/    # SignInForm, SignUpForm, InviteJoinForm
src/lib/auth.ts         # NextAuth config export
src/lib/db.ts           # Prisma client singleton
src/server/auth.ts      # requireAuth() helper
server/                 # Socket.io server (separate Node.js process)
  index.ts, middleware/auth.ts, handlers/
```

**Prisma schema** — complete model set (User, Workspace, WorkspaceMember, Channel, Message, InviteToken + NextAuth models Account, Session, VerificationToken). All IDs use `@default(cuid())`. Key indexes: `@@index([workspaceId])` on WorkspaceMember and Channel; `@@index([channelId, createdAt(sort: Desc)])` on Message; `@@index([token])` on InviteToken.

**Auth guard pattern** — every Route Handler starts with `requireAuth()` from `src/server/auth.ts`. Workspace-scoped handlers also call `requireWorkspaceMember(userId, workspaceId)` from `src/server/db/workspace.ts`. These throw strings ("UNAUTHORIZED", "FORBIDDEN") caught by the handler's try/catch.

**Error shape** — all Route Handlers return `{ error: string, code: string }` on failure. Standard codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`.

**Naming** — React components: PascalCase. All other files: kebab-case. API routes: plural nouns, kebab-case. Socket.io events: `noun:verb` (e.g. `message:send`, `message:new`).

**Socket.io event types** — defined in `src/types/socket.ts` before any handler is written (Story 1.4 establishes this file).

**Docker Compose** — 4 services: `postgres:16-alpine` (port 5432), `redis:7-alpine` (port 6379), `web` (port 3000), `socket-server` (port 3001). In Story 1.1–1.3, only postgres and redis services are needed for local dev.

## UX & Interaction Patterns

Auth flows are minimal and functional for MVP — no elaborate onboarding. Sign-up and sign-in pages are standalone pages under `(auth)` route group. After successful auth, redirect to `/` which redirects to the user's first workspace. Invite flow (`/invite/[token]`) shows workspace context before sign-up, lands the user directly in the workspace after account creation.

## Cross-Story Dependencies

- **1.1 must complete first** — all other stories depend on the initialized project.
- **1.2 (Docker/env) before 1.3** — Prisma migration requires a running Postgres.
- **1.3 (schema + migration) before 1.5–1.8** — auth flows require the User, Account, Session tables to exist.
- **1.4 (Socket.io scaffold) is independent of 1.5–1.8** — can be done in parallel but must be done before Epic 4.
- **1.5 (registration) before 1.6** — sign-in requires users to exist; both before 1.7 (GitHub OAuth) and 1.8 (route protection).
