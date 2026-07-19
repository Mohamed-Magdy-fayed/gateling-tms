# Rebuild State

> Single source of truth for rebuild progress. Read after README.md; update before every session ends.

## Status

- **Current phase:** Phase 0 — Init & tooling (NOT STARTED)
- **Target repo:** `G:\apps\gateling-tms` (does not exist yet — Phase 0 creates it)
- **Last session:** 2026-07-19 — blueprint authored; no build work done yet.

## Next action

> Execute `docs\rebuild\phases\phase-00.md` from step 1: create the target repo at `G:\apps\gateling-tms` with create-next-app.

## Phase checklist

| Phase | Status | Gate passed | Notes |
|---|---|---|---|
| 0 — Init & tooling | ☐ not started | — | |
| 1 — Core platform | ☐ not started | — | |
| 2 — Auth, orgs, onboarding | ☐ not started | — | |
| 3 — Landing pages | ☐ not started | — | |
| 4 — Content Library | ☐ not started | — | |
| 5 — Learning Flow | ☐ not started | — | |
| 6 — Live Classes (Zoom) | ☐ not started | — | |
| 7 — Excel + Google Forms import | ☐ not started | — | |
| 8 — Limits, polish, launch | ☐ not started | — | |

Statuses: `☐ not started` → `◐ in progress (step N done)` → `☑ complete (gate passed <date>)`.

## Decisions log

Decisions made during planning (2026-07-19, confirmed with Mohamed in Q&A):

| # | Decision |
|---|---|
| D1 | Single Next.js app (no monorepo). Donor code from `@workspace/*`-free single-app repos, so no flattening needed. |
| D2 | V1 scope = FREE tier only: Content Library, Learning Flow, Live Classes. All six paid modules → `05-roadmap.md` as "coming soon". |
| D3 | Platform core copied from DONOR-B (`G:\apps\gateling.com`): data table, forms, auth, i18n (has `dt()`), tRPC, Inngest, Firebase storage. |
| D4 | Tenancy: shared-schema row-level — `organizations` + `organization_memberships`, `organizationId` on every tenant table, active-org in session. Adapted from DONOR-B's branches model (renamed). |
| D5 | Auth: Redis-backed 7-day sessions, Google OAuth only, passkeys. Old app's 10-min JWT rejected. |
| D6 | Email: nodemailer ≥9.0.3 SMTP only. Resend dropped. |
| D7 | Free tier includes file uploads with an enforced 1 GB/org cap (landing copy kept as-is). |
| D8 | Live Classes copy says "powered by Zoom"; whiteboard/recording/screen-share delivered by Zoom natively. |
| D9 | Pricing page shows all 4 tiers; paid tiers badged "coming soon" with disabled/notify-me CTA. |
| D10 | Tooling: Biome + Playwright + vitest. |
| D11 | Vulnerable deps replaced, none blocked: drizzle-orm ≥0.45.2, nodemailer ≥9.0.3, next-auth/@auth/* removed, next-mdx-remote dropped, drizzle-kit ^0.31.10. "Not possible for now" ledger is empty. |
| D12 | Delivery model: segments → PRs; commit after every coherent change; CodeRabbit reviews every PR, agent fixes all findings, **Mohamed merges** (agent never merges, never commits to master). See `06-workflow.md`. |
| D13 | Databases: local Docker Postgres for dev; **Neon** for production (main branch) and per-PR preview (branch DBs). Migrations applied dev → preview → prod, generated-only. |
| D14 | Hosting: **Vercel** with per-PR preview deployments; env vars fully separated per environment scope (dev `.env` / Vercel Preview / Vercel Production). Change of host would be a new decision. |
| D15 | Code standard: human-readable, maintainable code per `06-workflow.md` §4 — applies to ported donor code as well. |
| D16 | Blueprint mirrored into TARGET `docs\rebuild\` from Phase 0; Desktop copy canonical until Phase 8 cut-over; re-mirrored in each phase's final PR. |

Add new decisions here as `D17`, `D18`, … with date and one-line rationale.

## Blockers

None.

## Environment / credentials needed later

Collected here so no phase is surprised (fill values into TARGET `.env`, never commit):

- `DATABASE_URL` (Postgres — local docker in dev; **Neon** connection strings for preview + production; Phase 0)
- GitHub: repo under Mohamed's account (`gh auth` must be logged in); **CodeRabbit app installed on the repo** (Mohamed authorizes via GitHub Marketplace; Phase 0)
- Vercel: project linked to the GitHub repo, Preview + Production env scopes populated (Phase 0)
- `SESSION_SECRET` / Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Phase 2)
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Phase 2); same Google Cloud project later used for Forms API (Phase 7)
- SMTP: host/port/user/pass for nodemailer (Phase 2)
- Firebase service account + bucket (Phase 4)
- Inngest keys for prod (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) (Phase 1 dev works keyless)
- Zoom app: `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, webhook secret (Phase 6)
