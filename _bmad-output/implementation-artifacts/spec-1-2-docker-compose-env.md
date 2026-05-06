---
title: '1.2 Docker Compose & Environment Configuration'
type: 'chore'
created: '2026-05-03'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no local infrastructure setup — developers can't run the app without manually installing and configuring Postgres and Redis.

**Approach:** Add `docker-compose.yml` with Postgres and Redis services, a `README.md` with a Local Setup section, and verify `.env.example` covers all required variables.

## Boundaries & Constraints

**Always:**
- `postgres:16-alpine` on port 5432 with health check.
- `redis:7-alpine` on port 6379 with health check.
- `.env` must be in `.gitignore` (already done in 1.1).
- `.env.example` must list all 7 required vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_SOCKET_URL`.
- README must have a Local Setup section with the exact 5-step flow.

**Never:**
- Do not add the `web` or `socket-server` Docker services yet — those come later.
- Do not commit `.env` — it is gitignored.

</frozen-after-approval>

## Code Map

- `docker-compose.yml` — postgres + redis services
- `.env.example` — already created in 1.1, verify completeness
- `README.md` — Local Setup documentation

## Tasks & Acceptance

**Execution:**
- [x] `docker-compose.yml` — create with postgres:16-alpine and redis:7-alpine, both with health checks
- [x] `.env.example` — verify all 7 required variables are present
- [x] `README.md` — create with project description and Local Setup section

**Acceptance Criteria:**
- Given Docker is installed, when `docker compose up -d` is run, then both postgres and redis start healthy
- Given `.env.example`, it lists DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, REDIS_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXT_PUBLIC_SOCKET_URL
- Given `.gitignore`, `.env` is listed
- Given `README.md`, a Local Setup section exists with the 5-step dev flow

## Verification

**Commands:**
- `docker compose config --quiet` -- expected: exit 0 (valid compose file)
- `grep -c "DATABASE_URL\|NEXTAUTH_SECRET\|NEXTAUTH_URL\|REDIS_URL\|GITHUB_CLIENT_ID\|GITHUB_CLIENT_SECRET\|NEXT_PUBLIC_SOCKET_URL" .env.example` -- expected: 7
