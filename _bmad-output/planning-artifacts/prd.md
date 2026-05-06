---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation-skipped", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
releaseMode: phased
classification:
  projectType: web_app
  domain: team_communication
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-slack-clone.md"
  - "_bmad-output/planning-artifacts/product-brief-slack-clone-distillate.md"
workflowType: 'prd'
---

# Product Requirements Document — slack-clone

**Author:** Arjun
**Date:** 2026-05-03
**Project Type:** Web Application (SPA, browser-first, real-time) | **Domain:** Team Communication | **Complexity:** Medium | **Context:** Greenfield

---

## Executive Summary

Small-to-mid tech teams need real-time, channel-organized messaging with complete searchable history — but the market has converged toward enterprise pricing that doesn't fit their scale. Slack's free tier truncates history at 90 days and Pro costs $7.25+/seat/month; open-source alternatives (Mattermost, Rocket.Chat) require heavy DevOps and have never achieved Slack's UX quality. This project fills that gap: a modern, browser-based team messaging application with workspace-organized channels, real-time messaging, and no artificial limitations — built on the de facto standard TypeScript web stack (Next.js, Prisma, PostgreSQL) and open-sourced from day one as both a production product and a reference implementation.

**Target users:** Small tech teams (5–50 people), startups, and remote dev teams currently on Slack who want equivalent functionality without per-seat pricing. Secondary: developers seeking a high-quality, real-world Next.js + WebSocket reference project.

**MVP scope:** Authentication (signup/login), workspace creation, channel management, member invitations, and real-time text messaging without page refresh.

### What Makes This Special

No OSS team messaging tool has achieved Slack's UX quality on a modern web stack — this is the primary product bet. Built with Shadcn/ui + TailwindCSS from day one, it matches the visual quality bar of well-crafted consumer apps rather than the dated feel of existing alternatives. No message history truncation by tier or age — full history is a core differentiator, not a premium feature. The Next.js + TypeScript + Prisma stack is what developers already know: a new contributor can understand the codebase and ship a feature in hours. Open-source from day one makes GitHub the primary distribution channel — the target audience discovers tools through repos, not pricing pages.

---

## Success Criteria

### User Success

- A new user can sign up, create a workspace, create a channel, and invite a team member in under 10 minutes
- Messages appear in all connected clients without page refresh — real-time delivery confirmed
- All sent messages are persisted and visible on channel reload (no message loss)
- Invite link flow works end-to-end: recipient clicks link → signs up → lands in the workspace

### Business Success

- MVP is deployable (local dev + production-ready Docker setup)
- Repository is open-sourced with a clear README covering setup, architecture, and contribution
- Core user flows covered by E2E tests before any public release

### Technical Success

- Message delivery latency <200ms for same-region users under normal load
- WebSocket connections reconnect gracefully on drop without user action
- Auth sessions secure: correct token handling, protected routes, no unauthenticated data access
- Real-time architecture decision (WebSocket library/service) made and documented before writing real-time code

### Measurable Outcomes

| Outcome | Target | Signal |
|---|---|---|
| Onboarding speed | <10 min to first message | Timed user test |
| Message latency | <200ms p95 same-region | Load test |
| E2E test coverage | All core flows pass | CI green |
| Auth security | No unprotected routes | Manual + automated audit |

---

## Product Scope & Roadmap

**MVP approach:** Problem-solving MVP — ship the minimum that enables a real team to use this for daily communication, end-to-end. Success = a team lead gets their 12-person team messaging in under 10 minutes.

**Resource requirements:** 1–2 engineers. Stack is well-known (Next.js + Prisma + PostgreSQL); no specialist skills required beyond standard full-stack TypeScript.

### Phase 1 — MVP

**Journeys supported:** J1 (Team Lead onboarding), J2 (Invited Member joining), J3 (Daily messaging), J4 (Admin management)

| Capability | Notes |
|---|---|
| Email/password signup + login | NextAuth.js; GitHub OAuth optional but recommended |
| Workspace creation | Name, slug, home screen |
| Public channel creation | Name, description; shown in sidebar |
| Invite link generation + join flow | Link-based; no email sending required |
| Real-time text messaging | Socket.io + Node.js server; send, receive, persist |
| Message history on load | Full history scrollback; no truncation |
| Member list + removal | Workspace settings panel |
| Protected routes | Unauthenticated → redirect to login |
| Workspace data isolation | Enforced at DB query layer |

### Phase 2 — Growth (Post-MVP)

- Direct messages (1:1 and group DMs)
- Message reactions (emoji), @mentions, pinned messages
- Threads (sub-conversations within channels)
- File and image uploads with inline preview
- Full-text search across all message history
- In-app notifications and @mention highlights
- User profiles and avatars
- Private channels
- Typing indicators

### Phase 3 — Vision

- AI-native features: thread summaries, smart notification filtering, async catch-up
- Self-hosted Docker Compose + optional managed hosted tier
- Native mobile apps (post product-market fit)
- Third-party integrations (GitHub, Jira, webhooks)
- Enterprise SSO / SAML

### Risk Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| WebSocket architecture choice | High — wrong choice = rewrite | Architecture spike as first task; Socket.io + Redis adapter recommended |
| Prisma schema design | Medium — painful to migrate | Schema review before first migration |
| GitHub discoverability | Market — adoption depends on it | Quality README + open-source from day one is a first-class deliverable |
| Solo developer timeline | Low — scope is tight | GitHub OAuth can slip to Phase 2 without breaking core flows |

---

## User Journeys

### Journey 1: The Team Lead — First Workspace (Happy Path)

**Meet Priya.** Engineering lead at a 12-person startup. Her team has been on Slack for two years. Last month the history cutoff hit — a critical architecture decision from 8 months ago is gone. She's seen this repo on GitHub and decides to try it on a Friday afternoon.

- **Opening:** Priya lands on the signup page. Email + password. Account created in under a minute.
- **Rising Action:** She's prompted to create a workspace — names it after her company, hits create, lands in the workspace home. Creates three channels: `#general`, `#engineering`, `#random`.
- **Climax:** She copies the invite link from workspace settings and pastes it into their Slack `#general`. Three teammates click it within five minutes. They appear in the member list in real time.
- **Resolution:** Priya sends the first message in `#engineering`. It appears instantly for her teammates. No refresh. No lag. Total time: 9 minutes.

**Capabilities revealed:** Signup, workspace creation, channel creation, invite link generation, member list, real-time message delivery.

---

### Journey 2: The Invited Member — Joining a Workspace

**Meet Rohan.** Backend developer on Priya's team. Gets a Slack message: "We're trying a new tool, click here." Mildly skeptical — he's seen three migrations in two years.

- **Opening:** Rohan clicks the invite link. Lands on a signup page with workspace context pre-filled — he knows exactly what he's joining.
- **Rising Action:** He creates his account. Dropped immediately into the workspace; all channels Priya created are visible in the sidebar.
- **Climax:** He opens `#engineering`, sees the history including Priya's "we're live" from two minutes ago. He replies. It appears for everyone instantly.
- **Resolution:** No configuration needed. Messaging in under 3 minutes of clicking the link.

**Capabilities revealed:** Invite link validation, invite-aware signup, automatic workspace + channel access post-signup, message history on first load.

---

### Journey 3: The Daily User — Real-Time Channel Chat

**Meet Dev.** In the workspace for a week. Opens the app in his browser tab.

- **Opening:** Clicks `#engineering`. Last 50 messages load instantly. Scrolls up — full history, nothing cut off.
- **Rising Action:** A teammate's message lands without a refresh. He replies. Three people in the conversation, flows like any chat app.
- **Edge case:** Dev's laptop sleeps for 20 minutes. When he opens the tab, the WebSocket reconnects silently. The 7 messages he missed appear without a refresh.
- **Resolution:** The tool disappears into the background. It just works.

**Capabilities revealed:** Message history pagination, real-time receive (WebSocket), graceful reconnection.

---

### Journey 4: The Workspace Admin — Managing the Space

**Meet Priya again** — two weeks in, managing a growing workspace.

- **Opening:** New designer joins. Priya opens workspace settings, copies the invite link, sends it. 30 seconds.
- **Rising Action:** A contractor's engagement ends. Priya removes them — access revoked immediately.
- **Climax:** Team needs a new project channel. Priya creates `#project-alpha`. It appears in the sidebar for all members.
- **Resolution:** Full control without tickets or slow admin panels. Workspace reflects the team's actual structure.

**Capabilities revealed:** Workspace settings, invite link management, member removal, public channel creation.

---

### Journey Requirements Summary

| Capability | Journey | MVP? |
|---|---|---|
| Email/password signup | J1, J2 | ✅ |
| Workspace creation | J1 | ✅ |
| Channel creation (public) | J1, J4 | ✅ |
| Invite link generate + join | J1, J2 | ✅ |
| Real-time message send/receive | J1, J2, J3 | ✅ |
| Message history on load | J2, J3 | ✅ |
| WebSocket reconnection | J3 | ✅ |
| Member list + remove | J4 | ✅ |
| Typing indicators | J3 | Post-MVP |
| Private channels | J4 | Post-MVP |

---

## Technical Architecture & Platform Requirements

### Rendering & Runtime

Next.js App Router — hybrid rendering: server-side for initial page load and authenticated route protection; client-side navigation and real-time updates post-login. The core chat interface behaves as a SPA after authentication. No full-page refreshes during normal use.

### Real-Time Architecture Decision

**Must be resolved before writing real-time code** — wrong choice requires a rewrite.

| Option | Pros | Cons |
|---|---|---|
| **Socket.io + Node.js server** | Full control, zero vendor cost, well-documented | Separate server process; horizontal scaling requires Redis adapter |
| **Ably** | Managed, auto-scales, presence built-in | Per-message cost at scale, vendor dependency |
| **Pusher** | Simple API, generous free tier | Connection limits, per-message pricing |
| **Next.js native WebSocket (edge)** | No separate server | Experimental, limited ecosystem |

**Recommendation:** Socket.io + dedicated Node.js server + Redis adapter. Zero cost for self-hosted deployments, well-understood pattern, no vendor lock-in. Revisit managed services if operational burden becomes a concern post-MVP.

### Browser Support

| Browser | Support |
|---|---|
| Chrome 110+ | ✅ Primary |
| Firefox 110+ | ✅ |
| Safari 16+ | ✅ |
| Edge 110+ | ✅ |
| Mobile Safari (iOS 16+) | ✅ |
| Chrome Android | ✅ |
| Internet Explorer | ❌ |

### Responsive Design

- **Desktop-first:** 3-column layout (workspace sidebar + channel list + main message area). Designed and tested at 1280px+ first.
- **Mobile web:** Sidebar collapses to a drawer; single-panel view switches between channel list and message view. No horizontal scroll.
- **No native apps for MVP** — mobile web only.

### Key Implementation Decisions

| Concern | Decision |
|---|---|
| Auth | NextAuth.js — email/password + GitHub OAuth; integrates cleanly with App Router |
| Real-time client | Socket.io client in a React context provider; reconnection handled by library |
| State management | React Server Components for initial data; Zustand or React context for real-time updates |
| Database access | Prisma ORM + PostgreSQL; PgBouncer or Prisma Accelerate for connection pooling in production |
| SEO | Not applicable for authenticated routes; SSR + Open Graph on landing/signup page only |

### Security Architecture

All API routes require authentication (unauthenticated → 401 or login redirect). WebSocket connections authenticate on handshake — connections are rejected before any data is exchanged if the session is invalid. All database queries are scoped to the authenticated user's workspace membership at the query layer (not the UI layer). A user may belong to multiple workspaces; cross-workspace data access is impossible by design. See NFR6–NFR12 for formal security requirements.

---

## Functional Requirements

### User Authentication & Session Management

- **FR1:** Visitors can create a new account using an email address and password
- **FR2:** Registered users can sign in with their email and password
- **FR3:** Registered users can sign in using their GitHub account
- **FR4:** Authenticated users can sign out and end their session
- **FR5:** Unauthenticated users attempting to access protected routes are redirected to the login page
- **FR6:** Authenticated sessions persist across browser refreshes and tab reopens

### Workspace Management

- **FR7:** Authenticated users can create a new workspace with a name
- **FR8:** The user who creates a workspace is automatically its admin
- **FR9:** Workspace members can view their workspace home screen after login
- **FR10:** Users who belong to multiple workspaces can navigate between them
- **FR11:** Workspace admins can access a workspace settings panel

### Channel Management

- **FR12:** Workspace members can create public channels with a name and optional description
- **FR13:** Workspace members can view all public channels in a sidebar navigation list
- **FR14:** Workspace members can open any channel to view its content
- **FR15:** Workspace admins can delete channels

### Membership & Invitations

- **FR16:** Workspace admins can generate a shareable invite link for their workspace
- **FR17:** Anyone with a valid invite link can join the associated workspace
- **FR18:** New users can create an account and join a workspace in a single invite-link flow (no separate signup step required first)
- **FR19:** Workspace members can view the full list of members in their workspace
- **FR20:** Workspace admins can remove a member from the workspace
- **FR21:** Removed members immediately lose access to the workspace, its channels, and its messages

### Real-Time Messaging

- **FR22:** Workspace members can send text messages in any channel they have access to
- **FR23:** All members with the channel open receive new messages instantly without refreshing the page
- **FR24:** The client automatically reconnects to real-time updates after a connection drop
- **FR25:** Messages sent while a client was disconnected are delivered and visible upon reconnection

### Message History & Persistence

- **FR26:** Workspace members can view the complete message history of any channel they have access to
- **FR27:** Message history loads incrementally as users scroll upward (pagination)
- **FR28:** All messages are stored permanently — no truncation by age, count, or tier
- **FR29:** Each message displays the sender's display name and send timestamp

### Access Control & Data Isolation

- **FR30:** All workspace data (channels, messages, members) is isolated — a member of Workspace A cannot access data belonging to Workspace B
- **FR31:** The system verifies user authentication before accepting any WebSocket connection
- **FR32:** Only members of a workspace can access that workspace's channels and messages
- **FR33:** Workspace admin permissions (invite link management, member removal, channel deletion) are distinct from regular member permissions

---

## Non-Functional Requirements

### Performance

- **NFR1:** Message delivery latency (send → all connected clients receive) <200ms at p95 under normal load, same-region
- **NFR2:** Channel message history (initial 50 messages) loads within 500ms on broadband
- **NFR3:** Time to interactive for authenticated users <2 seconds on broadband
- **NFR4:** WebSocket connection re-establishes within 3 seconds of a network interruption, without user action
- **NFR5:** Auth API endpoints (login, signup) respond within 500ms at p95

### Security

- **NFR6:** Passwords hashed with bcrypt, minimum cost factor 12
- **NFR7:** Session tokens stored in HttpOnly, Secure cookies — not in localStorage or sessionStorage
- **NFR8:** All production traffic served over HTTPS; HTTP redirects to HTTPS
- **NFR9:** WebSocket connections authenticate via session on handshake; unauthenticated connections rejected before any data exchange
- **NFR10:** Auth endpoints (login, signup, invite) rate-limited to max 10 requests/minute per IP
- **NFR11:** All database queries scoped to the authenticated user's workspace membership — no cross-workspace data leakage possible
- **NFR12:** Application protected against XSS (CSP headers, sanitised output) and CSRF (SameSite cookie policy or CSRF tokens)

### Scalability

- **NFR13:** WebSocket server supports horizontal scaling via a shared pub/sub layer (Redis adapter) — a single Node.js process is not a hard connection ceiling
- **NFR14:** Database schema supports multiple workspaces with unlimited members and channels, without per-tenant schema separation
- **NFR15:** Each server instance handles at least 100 concurrent WebSocket connections without degradation in message delivery latency

### Accessibility

- **NFR16:** Core flows (signup, login, workspace navigation, channel messaging) meet WCAG 2.1 AA
- **NFR17:** All interactive elements keyboard-navigable with visible focus indicators
- **NFR18:** All non-decorative images and icons have ARIA labels or alt text
- **NFR19:** UI colour contrast meets WCAG AA minimums (4.5:1 normal text, 3:1 large text)

### Reliability

- **NFR20:** Messages persisted to the database before broadcast to connected clients — no delivery without persistence confirmation
- **NFR21:** Application degrades gracefully if WebSocket server is unreachable — connection status indicator visible; previously loaded history remains accessible
- **NFR22:** Database migrations are backward-compatible and applied without downtime via Prisma migrate
