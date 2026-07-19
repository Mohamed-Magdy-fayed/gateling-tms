# Rebuild State

> Single source of truth for rebuild progress. Read after README.md; update before every session ends.

## Status

- **Current phase:** Phase 0 — Init & tooling (☑ complete, gate passed 2026-07-19)
- **Target repo:** `G:\apps\gateling-tms` — created, tooling in place.
- **GitHub:** `https://github.com/Mohamed-Magdy-fayed/gateling-tms` (private). Old SOURCE repo renamed to `gateling-tms-legacy` (still public) to free the name.
- **Vercel:** project `gateling-tms` (id `prj_cT7oVrlzsKpFw1TY4mWYv3XZjIGK`) — the pre-existing production project serving `tms.gateling.com` — has been **relinked** to the new GitHub repo (done by Mohamed 2026-07-19). Any push to `master` now deploys to production immediately.
- **Neon:** connection strings for preview and production provided by Mohamed, stored locally only in `.env.preview.local` / `.env.production.local` (gitignored, not committed). **Not yet pasted into Vercel's Preview/Production env var scopes** — no MCP tool available to do this remotely; needs manual entry in the Vercel dashboard.
- **Last session:** 2026-07-19 — Phase 0 executed end-to-end (steps 1–11) and gate passed.

## Next action

> Start Phase 1 (`docs\rebuild\phases\phase-01.md`) — core platform (i18n, forms, data table, tRPC, drizzle, Inngest, Firebase), porting from DONOR-B. Before starting, Mohamed should paste the Neon `DATABASE_URL` values from `.env.preview.local` / `.env.production.local` into Vercel's Preview/Production env scopes (see Blockers) so the first Phase 1 PR's preview deploy has a working database.

## Phase checklist

| Phase | Status | Gate passed | Notes |
|---|---|---|---|
| 0 — Init & tooling | ☑ complete | 2026-07-19 | See gate results below |
| 1 — Core platform | ☐ not started | — | |
| 2 — Auth, orgs, onboarding | ☐ not started | — | |
| 3 — Landing pages | ☐ not started | — | |
| 4 — Content Library | ☐ not started | — | |
| 5 — Learning Flow | ☐ not started | — | |
| 6 — Live Classes (Zoom) | ☐ not started | — | |
| 7 — Excel + Google Forms import | ☐ not started | — | |
| 8 — Limits, polish, launch | ☐ not started | — | |

Statuses: `☐ not started` → `◐ in progress (step N done)` → `☑ complete (gate passed <date>)`.

## Phase 0 gate results (2026-07-19)

- ✅ `npm run check` (typecheck + Biome lint) green
- ✅ `npm run build` green (Turbopack, 2 static routes)
- ✅ `npm test` (vitest, 1 placeholder) green
- ✅ `npm run test:e2e` (Playwright, desktop + mobile projects, 1 smoke test) green
- ✅ `npm run audit:gate` → **0 vulnerabilities**
- ✅ No package outside `02-dependencies.md` (added `@base-ui/react` to the approved shadcn/ui deps row — see D18)
- ✅ Grep repo for `HBS` → zero hits in application code (only appears in `docs/rebuild/` prose describing the ban itself, and coincidentally in unrelated base64 hashes in `package-lock.json` / `.next` build artifacts)
- ✅ GitHub repo exists (`Mohamed-Magdy-fayed/gateling-tms`, private) and mirrors local master (11 commits)
- ⏸ CodeRabbit: `.coderabbit.yaml` committed; **Mohamed still needs to install/authorize the CodeRabbit GitHub app on the repo** before the first Phase 1 PR
- ⏸ Vercel preview deploy: project relinked to the new repo; not yet exercised with an actual PR (no PR opened yet — Phase 0 work went straight to `master` per the bootstrap exception in `06-workflow.md`)
- ⏸ Neon prod DB reachable: connection strings in hand, not yet wired into Vercel env scopes (see Blockers)

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
| D17 | GitHub repo name collision: old SOURCE repo already occupied `gateling-tms` (public, last pushed 2025-07-29). Renamed it to `gateling-tms-legacy` rather than picking a different name for the rebuild, so the new repo keeps the canonical name. Decided with Mohamed 2026-07-19. |
| D18 | Vercel project name collision: the existing `gateling-tms` Vercel project is **live in production** on `tms.gateling.com` / `courses.megz.pro` — unlike GitHub, renaming risked breaking domain bindings, so instead Mohamed relinked that same project's Git source to the new repo (2026-07-19). Consequence: every push to `master` from now on deploys straight to production; there is no separate "new" Vercel project. `@base-ui/react` added to `02-dependencies.md`'s approved shadcn/ui deps (required by the `base-mira` style DONOR-B uses); audited clean, 0 vulnerabilities. |

Add new decisions here as `D19`, `D20`, … with date and one-line rationale.

## Blockers

- **Neon env vars not yet in Vercel.** Mohamed provided Neon preview + production `DATABASE_URL` values (stored in TARGET's gitignored `.env.preview.local` / `.env.production.local`). No MCP tool here can write Vercel project env vars remotely — Mohamed needs to paste these into Vercel's Preview and Production env var scopes manually before Phase 1's first migration/deploy.
- **CodeRabbit not yet authorized** on the new repo — install before opening the first Phase 1 PR (required by the workflow gate).
- **Production is now live-wired to `master`.** Because the Vercel project was relinked (D18) instead of created fresh, every future push to `master` deploys to `tms.gateling.com` immediately — there is no staging buffer beyond PR preview deploys. Every merge request to Mohamed from Phase 1 onward should call this out explicitly.

## Environment / credentials needed later

Collected here so no phase is surprised (fill values into TARGET `.env`, never commit):

- `DATABASE_URL` (Postgres — local docker in dev, port **5433** on `gateling_tms_db`; **Neon** connection strings for preview + production already in hand, not yet in Vercel scopes; Phase 0) ✅ local, ⏸ Vercel scopes
- GitHub: repo under Mohamed's account (`gh auth` logged in); **CodeRabbit app installed on the repo** — still pending (Phase 0)
- Vercel: project linked to the GitHub repo ✅ (relinked existing production project, D18); Preview + Production env scopes still need `DATABASE_URL` populated
- `SESSION_SECRET` / Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Phase 2)
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Phase 2); same Google Cloud project later used for Forms API (Phase 7)
- SMTP: host/port/user/pass for nodemailer (Phase 2)
- Firebase service account + bucket (Phase 4)
- Inngest keys for prod (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) (Phase 1 dev works keyless)
- Zoom app: `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, webhook secret (Phase 6)
