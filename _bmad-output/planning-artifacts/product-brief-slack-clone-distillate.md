---
title: "Product Brief Distillate: slack-clone"
type: llm-distillate
source: "product-brief-slack-clone.md"
created: "2026-05-03"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Slack Clone

## Technical Context

- **Stack (decided, not negotiable):** Next.js (App Router), TypeScript, Prisma ORM, PostgreSQL, Shadcn/ui, TailwindCSS
- **Auth:** Email/password + GitHub OAuth (GitHub OAuth is a deliberate dev-audience signal, not just convenience)
- **UI source:** User will supply UI screenshots to ground the design — PRD phase should treat these as spec-level inputs, not inspiration
- **Real-time (UNRESOLVED — highest-priority PRD decision):** WebSocket architecture must be chosen before implementation. Options: self-managed Node/Socket.io server, Next.js edge WebSocket, managed service (Ably, Pusher). Tradeoffs: operational complexity vs. cost vs. vendor lock-in. This affects MVP feasibility and scaling ceiling.
- **Database:** PostgreSQL via Prisma — schema design for messages, channels, workspaces, and presence state is a core PRD deliverable
- **File storage:** Not specified — PRD needs to decide between self-hosted (local/S3) and a managed upload service

## Requirements Hints (captured, not yet formalized)

- Message delivery latency target: <200ms same-region
- Search response target: <1 second regardless of history depth
- Onboarding time target: new team messaging in <10 minutes (no DevOps for hosted path)
- Must support responsive design — desktop-first, mobile web required at MVP
- Full message history — no truncation by tier or age (this is a core differentiator vs Slack free)
- E2E tests required for core flows before ship

## Scope Signals (in/out/maybe)

**Confirmed IN for MVP:**
- Workspace + invite-link onboarding
- Public and private channels
- Threads (sub-conversations within channels)
- 1:1 DMs and group DMs
- Real-time presence + typing indicators
- File and image uploads with inline preview
- Message reactions, @mentions, pinned messages
- Full-text search across all history
- User profiles + avatars
- Role-based admin: member management, channel management
- In-app notifications
- Responsive web (desktop-first)

**Confirmed OUT for MVP:**
- Video/voice calls
- Third-party integrations (GitHub bots, Jira, Zapier)
- Native mobile apps
- Enterprise SSO/SAML
- AI features (any)
- Multi-workspace federation
- Slash command framework
- SOC 2 / GDPR compliance attestation
- Audit logs / data export

**Open / Maybe (not decided):**
- Push notifications (browser/web push) — not mentioned but likely expected by users; PRD should decide
- Email notifications (new message digests) — common expectation, not mentioned
- Message editing + deletion — not mentioned, should be in PRD
- Read receipts — not mentioned, controversial UX choice
- Emoji picker (custom vs. system) — UI detail for PRD

## Competitive Intelligence (for PRD context)

- **Slack:** Category leader, 90-day free history limit, ~$7.25/user/month Pro, pricing increased 2022 and 2024. Primary migration trigger for target users.
- **Microsoft Teams:** Enterprise-bundled, bloated for small teams, poor standalone value
- **Mattermost:** Open-source, self-hosted, DevOps-heavy to run, developer-focused but dated UX
- **Rocket.Chat:** Open-source, HIPAA/GDPR, self-hosted, heavy resource footprint, inconsistent mobile
- **Discord:** Community-focused, lacks professional workflow integrations, not trusted as a work tool
- **Pumble / Chanty:** Low-cost Slack alternatives, limited brand credibility, feature gaps

**Key competitive insight for PRD:** None of the OSS alternatives (Mattermost, Rocket.Chat) have achieved Slack's UX quality on a modern web stack. That gap is the primary product bet here.

## Ideas and Decisions

| Idea | Status | Rationale |
|------|--------|-----------|
| GitHub OAuth as first social login | Accepted | Developer-first positioning signal; drives credibility with target audience |
| Open-source from day one | Accepted | Primary distribution strategy for dev audience; GitHub stars as adoption metric |
| AI features (summarization, smart notifications) | Deferred to post-MVP | Architectural advantage if built into data model early; not MVP scope |
| Self-hosted path + optional hosted tier | Accepted as vision | Differentiates from SaaS-only alternatives; requires clean Docker/deployment docs |
| Video/voice calling | Rejected for MVP | Adds significant infra complexity; not core to messaging differentiation |
| Multi-workspace federation | Rejected for MVP | Architectural complexity not justified at MVP stage |
| Native mobile apps | Rejected for MVP | Web-responsive first; native only after product-market fit |
| Slash command framework | Rejected for MVP | Valuable but not table-stakes; defer until after integrations story is clearer |

## User Scenarios (richer than brief)

- **Scenario 1 (primary):** A 15-person startup currently paying $130/month for Slack Pro evaluates switching. They self-host the app on a $20/month VPS. Full message history preserved. Onboarding takes 15 minutes. Monthly cost drops to ~$5 (hosting only).
- **Scenario 2 (discovery):** A developer sees the GitHub repo while searching "Next.js Prisma real-time example." Stars it as a reference. Spins it up locally. Mentions it to their team. Team evaluates as a Slack replacement.
- **Scenario 3 (dev team):** A remote dev team uses channels for #general, #engineering, #random, and a private channel per project. They use threads to keep conversations organized without channel sprawl. They search old messages to find decisions made 8 months ago (not possible on Slack free).

## Open Questions (unresolved, PRD should address)

1. **WebSocket architecture:** Self-managed vs. managed service — cost, complexity, scaling ceiling tradeoffs
2. **Product name:** "Slack Clone" is a working name; a proper product name is needed before public launch
3. **Pricing model:** Free open-source? Paid hosted tier? Freemium? Not decided.
4. **File storage backend:** Local filesystem (dev only), S3-compatible, or managed upload service?
5. **Push notifications:** Browser push and/or email digest — expected by users, not mentioned in brief
6. **Message editing/deletion:** Should be in MVP but not explicitly confirmed
7. **Deployment story:** Docker Compose for self-hosting — who owns the documentation and what's the minimum spec?
8. **UI screenshots:** User will provide — PRD must treat these as design spec, not reference

## Market Context Worth Preserving

- Team collaboration software market: $14B–$36B in 2024, CAGR 7–13.5% through 2030–2033
- Remote/hybrid work has permanently expanded TAM — structural demand, not cyclical
- SMBs and startups are the fastest-growing buyer segment
- 59% of knowledge workers report stronger team connection with feature-rich messaging; 34% of orgs see lower turnover — ROI framing is available for go-to-market
- Slack's pricing hike is the single most-cited trigger for teams evaluating alternatives

## Reviewer Findings (for PRD architect awareness)

**Skeptic flags:**
- Distribution strategy needs to be explicit in PRD — open-source + dev community is the answer, but it needs to be designed, not assumed
- "Extensibility" must be backed by a concrete API or plugin architecture decision in PRD/Architecture phases
- WebSocket scaling is the highest unacknowledged technical risk

**Opportunity flags:**
- Developer-first positioning (code snippet formatting, webhook-ready architecture, GitHub auth) should be reflected in feature prioritization
- Open-source repo quality (README, docs, Docker Compose setup) is a first-class product deliverable, not an afterthought
- AI-native features are a long-term architectural bet — even if not in MVP, the data model should be designed to support them without a rewrite
