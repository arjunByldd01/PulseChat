# Slack Clone

A modern, open-source team messaging application built on the T3 stack — Next.js 15, Prisma, PostgreSQL, NextAuth.js, Socket.io, and Shadcn/ui.

**Why this exists:** Slack's free tier truncates message history; open-source alternatives lack UX quality. This project delivers Slack-equivalent functionality with full message history, on a modern TypeScript stack you already know.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn/ui |
| Auth | NextAuth.js v5 (email/password + GitHub OAuth) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Real-time | Socket.io + Redis adapter |
| Cache/Pub-sub | Redis 7 |
| State | Zustand |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd slack-clone
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in the required values. For local development, the defaults work out of the box except for `NEXTAUTH_SECRET` (generate one with `openssl rand -base64 32`).

3. **Start Postgres and Redis**
   ```bash
   docker compose up -d
   ```
   Wait for both services to show as healthy:
   ```bash
   docker compose ps
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   - Next.js app: http://localhost:3000
   - Socket.io server: http://localhost:3001

---

## Project Structure

```
src/
  app/          # Next.js App Router pages and API routes
  components/   # React components (auth, workspace, channel, message)
  lib/          # Shared utilities (db, auth, utils)
  server/       # Server-side helpers and data access layer
  types/        # Shared TypeScript types (socket events, API)
  store/        # Zustand state stores
  providers/    # React context providers

server/         # Socket.io server (separate Node.js process)
prisma/         # Prisma schema and migrations
```

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret (min 32 chars) | Yes |
| `NEXTAUTH_URL` | App base URL | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | Optional |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Optional |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL (client-side) | Yes |

---

## Development Scripts

```bash
npm run dev          # Start Next.js + Socket.io concurrently
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```
