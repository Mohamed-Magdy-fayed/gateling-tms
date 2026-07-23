# 06 — Working Method (Segments, Git, CodeRabbit, Environments)

How the agent works day-to-day. This is process law, same weight as `02-dependencies.md`. Mohamed supervises by reading agent messages and testing on localhost/preview — the workflow below is designed for that.

## 1. Segment-based delivery

- A **segment** = the smallest slice a human can verify: one entity's CRUD, one flow (e.g. "email verification"), one import pipeline. Phases (phase-00…08) are made of segments; a phase is typically 2–6 segments/PRs.
- **Always green on localhost.** After every commit `npm run dev` must work and nothing previously working may break. Never leave the app in a torn-apart state between messages.
- **Narrate the work.** Each agent message states: *which segment/area is being worked on now*, *what just became testable*, and *exactly how Mohamed can verify it on localhost* (URL + click path + seed login if needed). No silent multi-hour rewrites.

## 2. Git & GitHub

- Repo is created **locally and on GitHub** in Phase 0 (`gh repo create` under Mohamed's account, private).
- `master` is protected in spirit: the agent **never commits to master directly** after the Phase 0 bootstrap commit. All work goes through branches + PRs.
- Branch naming: `phase-04/courses-crud`, `phase-02/google-oauth` (phase + segment slug).
- **Commit after every single coherent change** — one logical change per commit (a migration, a component, a router, a fix). Conventional messages (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`). Small commits are the review trail; never batch a day of work into one commit.
- Push the branch after each commit (or at minimum before every message to Mohamed) so GitHub always mirrors local state.

## 3. Pull request + CodeRabbit loop (every segment)

1. **Open a PR** for the segment early (draft while in progress, ready when the segment's checks pass). PR description: what it does, how to test on localhost step-by-step, which phase step(s) it completes, screenshots for UI work.
2. **Local gate before "ready":** `npm run check` + `build` + `test` (+ `audit:gate`) green.
3. **CodeRabbit reviews automatically** (installed in Phase 0). The agent must:
   - wait for the review, read **every** comment;
   - **fix every actionable finding** with follow-up commits (never dismiss to save effort);
   - reply to each comment: what was fixed, or a concrete technical justification when disagreeing (and mark such disagreements in the PR summary for Mohamed);
   - re-run local gates after fixes; repeat until CodeRabbit has no unresolved actionable comments.
4. **Ask Mohamed to merge.** The agent **never merges**. The merge request message includes: segment summary, how-to-test, CodeRabbit outcome (N findings fixed, M disputed + why), gates status.
5. After Mohamed merges: pull `master`, update `STATE.md` (segment done, next action), start the next segment branch. If Mohamed requests changes instead, that feedback outranks everything — address it first.

Iterate: segment → PR → CodeRabbit fixes → Mohamed merges → next segment. **No new segment is started while a previous PR is awaiting CodeRabbit fixes** (waiting for Mohamed's merge is fine — prepare the next branch off the pending one only if independent, and say so).

## 4. Code quality standard (human-readable, maintainable)

Applies to every line, including adapted donor code:

- **Readable first.** Code a mid-level developer understands on first read: descriptive names (no abbreviations like `usrOrgMbr`), small focused functions (<50 lines), small cohesive files (200–400 lines typical, 800 hard max), early returns over nesting (≤4 levels).
- **Self-documenting.** Comments only for constraints the code can't express (why, not what). No commented-out code, no `console.log`, no TODOs without a STATE.md/issue reference.
- **Typed end-to-end.** No `any`; types flow from Zod schemas and Drizzle — one source of truth per shape. No copy-pasted near-duplicates: extract when repetition is real (DRY), don't pre-abstract (YAGNI), keep it simple (KISS).
- **Consistent shape.** Every entity follows the same pattern (A's entity blueprint: table page / columns / form dialog / router / schema file) — a developer who learns one module knows them all.
- **Immutable data patterns**, explicit error handling at boundaries, user-facing errors localized (EN/AR), server errors logged with context.
- Donor code adapted into the repo is held to the same bar — fix naming/dead code while porting; don't import mess.
- **Use the design system primitives, not bare markup.** Since the Claude Design handoff landed (STATE.md D34, PR #5), every new or touched UI surface must build with the ported primitives (`avatar`, `breadcrumbs`, `course-card`, `empty-state`, `icon-button`, `progress`, `segmented-control`, `stat-card`, `tag`, plus the pre-existing `card`/`alert`/`badge`) instead of raw `<div className="rounded-lg border p-4">`-style markup or bare `H3`/`Muted` typography standing in for real content. This was missed on the first pass (STATE.md D52 — the dashboard shipped as literal placeholder text, `organizations-settings-page.tsx` used raw divs/`Badge` instead of `Tag`/`stat-card`), so treat it as a first-class review item, same weight as bilingual/RTL: before opening a PR for any `(system)` or `(landing)` page, check it against the primitive list and swap bare markup for the matching component. Don't block a whole phase to retrofit every existing page at once — fix what a segment touches, and land dedicated design-adoption segments for already-shipped pages when they're next touched or when Mohamed flags them (as happened with the dashboard, D52).

## 5. Environments & databases

Three environments, fully separated env vars (no sharing, no fallbacks across envs):

| | **dev (localhost)** | **preview (per-PR)** | **production** |
|---|---|---|---|
| App | `npm run dev` | Vercel preview deploy per PR | Vercel production |
| Postgres | **Docker** (`docker compose up -d`, Phase 0) | **Neon branch DB** (branched from prod schema per preview) | **Neon main branch** |
| Redis (sessions/ratelimit) | Upstash dev database | Upstash preview database | Upstash prod database |
| Email | SMTP dev/log transport (no real sends) | real SMTP, test inbox | real SMTP |
| Firebase bucket | dev bucket | dev bucket (or preview folder) | prod bucket |
| Inngest | `inngest-cli dev` (keyless) | Inngest preview env keys | Inngest prod keys |
| Zoom / Google OAuth | dev app credentials + localhost redirect URIs | dev credentials + preview redirect URIs | prod app credentials |
| Env vars live in | `.env` (gitignored; `.env.example` committed) | Vercel env vars, **Preview** scope | Vercel env vars, **Production** scope |

Setup happens in Phase 0 (Vercel project + Neon project + env scaffolding); credentials Mohamed provides are tracked in `STATE.md` → "Environment / credentials needed".

### Migration cadence (Drizzle)

- **Schema change = same PR contains**: schema edit + `npm run db:generate` output (SQL + `meta/` + `_journal.json`). Never `db:push`, never hand-edited structural SQL (data migrations: hand-written SQL allowed, clearly labeled).
- **Dev:** run `npm run db:migrate` against local Docker immediately after generating — the PR is tested on a migrated DB.
- **Preview:** preview deploys run `db:migrate` against their Neon branch (build step or `vercel-build` script) — every PR is exercised against its own migrated database, safely.
- **Prod:** after Mohamed merges to master, migrations are applied to Neon main as part of the production deploy (same migrate step). The agent confirms in the post-merge message that prod migration succeeded (or flags it as pending if deploy is manual).
- A migration that fails on preview blocks the PR — fix forward in the same PR.

## 6. Communication contract with Mohamed

- Every working message: **current segment**, what changed, **how to test it right now**, what's next.
- Ask Mohamed only for: merges, credentials, and genuine product decisions (recorded as D-numbers in STATE.md). Everything else: decide per this blueprint and record it.
- End-of-session: STATE.md updated (segment status, open PR links, next action) so the next session resumes cold from the kickoff command.
