# Seeding And Demo Data

## Purpose

This document describes how Gateling-TMS's local seed data works: what each profile contains,
how idempotency is guaranteed, and how to add a new seeded entity. Structured after DONOR-B's
(`gateling.com`) planning doc of the same name, but describing what is actually built here rather
than an aspirational target — every section below matches real code in `src/drizzle/seed/`.

## Seed Profiles

Three profiles exist, run via `npm run db:seed:<profile>` (or `npm run db:seed` for `baseline`,
the default).

### 1. `baseline`

The smallest viable local bootstrap: one organization (`Gateling-TMS Dev Academy`, short code
`DEV1`) with an admin, a teacher, and two students — all signed in with the same documented dev
password (`SEED_DEFAULT_PASSWORD`, see the root `README.md`'s "Seeded accounts" table), and the
"Main" branch every academy has. No domain content (no courses, groups, or trainees). This is what
every other profile builds on top of.

### 2. `demo`

The realistic-academy, screenshot/demo dataset. Runs `baseline` first, then adds to the *same*
organization — sign in with the documented admin/teacher accounts and the org is already full of
content, rather than needing a second login to see it. It spans **two branches** — "Main" (the
two English batches) and "Online" (the business batch) — so the branch switcher, the Branch
columns and the dashboard's per-branch split all have something to show:

- **2 courses** ("English Foundations", "Business English Essentials"), each with 2 levels, 2
  lectures per level, and one published quiz form (1 section, 3 questions, 3 answers each).
- **3 groups** with weekly schedules, each expanded into up to 12 generated sessions via the same
  pure `generateSessionOccurrences` expander the real `group/schedule-changed` Inngest function
  uses (`src/features/system/students/groups/server/schedule.ts`). One group ("Beginner Batch
  A") is seeded as already started — see "Meeting fixture data" below.
- **25 trainees**, split across the three groups' rosters, with enrollments spanning the full
  status lifecycle (`completed` → a certificate, `ongoing`, `waiting`, `placementTest`,
  `postponed`/`cancelled`), level-progress rows for anything past `waiting`, and manually-recorded
  attendance on the earliest 4 sessions of that started group.

All names/emails/phones are hand-authored, deterministic literal data
(`src/drizzle/seed/profiles/demo/data.ts`) — no data-generation library is approved
(`docs/rebuild/02-dependencies.md` has no faker-style package), and adding one wasn't justified
for a one-off dataset.

#### Meeting fixture data

Nothing in this profile contacts Gateling Meetings. "Beginner Batch A"'s generated sessions are
written as if a host had already pressed "Start class": `status: "ongoing"`, a Meetings-shaped
`meetingCode` (`fix-demo-001`…), a `joinUrl` on `https://meetings.example.test` — a host that never
resolves — and `meetingHostUserId` set to the seeded teacher.

That last field is what makes the fixture worth having: signed in as the teacher, those rows show
**"Start class"** (the host link); signed in as the admin they show **"Join"** — the two states a demo
has to show, and the two `e2e/journey/meetings-fixture-session.spec.ts` asserts. Neither link is
ever followed in CI: following one asks Meetings for a signed URL, and there is nothing to answer.

A real session gets those fields **only when a host presses "Start class"** (STATE.md D143), so
without the fixture there would be no way to see the already-started state in a screenshot or an
e2e run.

### 3. `performance`

Near-limit volumes to exercise the usage-limit UI (`PlanUsageCard`/`PlanLimitNotice`, Phase 8
segment ①) in its at-cap state: its **own** organization (short code `PERF`, not `baseline`'s),
exactly **50 trainees** and **5 courses** — the Free-plan caps from `00-product-spec.md`. Its own
org rather than stacking onto `demo`'s (`constants.ts`'s `SEED_PERFORMANCE_ORG_ID` comment has the
reasoning) — combining the two would blow past the caps in a way that no longer demonstrates
"just under the limit." Deliberately shallow beyond that (no levels/lectures/groups/enrollments):
the point is counter/query volume and the limit UI, not a second realistic-academy dataset.

### 4. `showcase` (preview only)

The sales-demo academy: **Horizon Language Academy** (short code `HORIZON`, Enterprise plan,
Africa/Cairo, EGP), with two years of history ending today. Run with `npm run seed` (or
`npm run db:seed:showcase`); the preview build runs it on every deploy.

- **Who signs in:** `mohamed.ahmed.sc2@gmail.com` is its admin, through Google sign-in. If that
  user isn't in the database yet the seed adds a password-less row, and Google sign-in links to it
  by email. No seeded password reaches this org — teachers and student accounts have none.
- **What's in it (data version 2):** three branches — **Nasr City**, **Maadi** and **Online** —
  each with 23 teachers assigned to it and available Saturday to Thursday. 6 courses of 4–8
  classes (13 levels, 37 lectures, a published quiz per level, a final exam and placement test per
  course). A new cohort opens every day, taking turns between the branches, since 2024-10-05;
  45% are one-to-one, the rest groups of 5–10. That comes to ~2,000 trainees, ~770 groups, ~5,400
  classes, ~21,000 attendance records (Online's joined through Meetings since June 2025, the
  buildings' marked by the teacher, with lateness), ~5,200 payments in installments across every
  method, ~2,700 certificates, placement tests (portal students' with their submitted answers),
  quiz and final-exam responses — each final exam has an open question, so ~80 wait in the grading
  queue while the rest are graded — and trainee notes. A student stays in one branch for every
  course they take. Every status is present at once: upcoming cohorts in placement and waiting,
  running ones ongoing, past ones completed, dropped (`cancelled`) and `postponed` seats, classes
  called off, and groups **paused** or **cancelled** part-way (their remaining classes called off).
- **Data version.** The academy records which version of this dataset it holds (an
  `organization_settings` row, `seed.showcase.dataVersion`, which the preferences registry ignores).
  When `SHOWCASE_DATA_VERSION` in `showcase/index.ts` is bumped, the next run deletes the Horizon
  academy and the showcase's own accounts (`*@horizon-academy.example`,
  `*@students.horizon-academy.example`) once and rebuilds it — the only time this profile deletes
  anything, and never outside that academy. Bump it when the shape changes in a way adding rows
  can't reach.
- **Only preview gets it — fail-closed.** On Vercel it runs only when `VERCEL_ENV=preview`;
  production, development, or a missing `VERCEL_ENV` all skip with exit 0, decided in `cli.ts`
  before anything touches the database (`showcase/guard.ts`, tested in
  `tests/seed-showcase-guard.test.ts`). Off Vercel (local Docker) it runs unless the env claims
  production. So one build command can serve both environments.

How it stays safe to run on every build — different from `seedIfMissing`'s natural keys, because
2,000 trainees and 37,000 attendance rows can't afford a lookup per row:

1. **Deterministic history.** Every id is a UUID derived from a stable key (`stableId` in
   `showcase/determinism.ts`), and every "random" choice comes from a PRNG seeded by that key. The
   history from the fixed anchor date never changes; only how much of it exists, and each row's
   state, depend on the clock. `planShowcase()` is a pure function of `now` (unit-tested in
   `tests/seed-showcase-plan.test.ts`).
2. **Add what's missing.** For each table the writer reads which planned ids already exist and
   batch-inserts the rest (`on conflict do nothing`). Rows the app deleted come back on the next
   build, children included; rows anyone added in the app are never looked at; nothing is deleted.
3. **Move untouched rows forward in time.** A class that has now happened becomes `completed`, a
   finished cohort's group and enrollments become `completed`, level progress advances. Seeded rows
   are written with `updatedAt = createdAt`; an edit in the app bumps `updatedAt`, and the update
   only matches rows where the two are still equal — **an edited row is never overwritten**.

So each deploy appends the classes, attendance, payments, certificates and new cohorts that have
"happened" since the last one, and the demo always looks current. `SEED_NOW=<ISO date>` pretends
the run happens at another moment (for local checks only). A run with nothing to do takes ~5s; the
first run on an empty database ~25s.

## Directory Structure

```text
src/drizzle/seed/
  base.ts              # seedIfMissing — the idempotency primitive every profile uses
  clear-db.ts           # destructive, host-guarded, never called from the default flow
  cli.ts                  # npm run db:seed[:demo|:performance|:showcase|:clear], npm run seed
  constants.ts              # natural keys / well-known ids shared across profiles
  index.ts                   # profileRunners registry
  lib/
    seed-member.ts            # shared user+credentials+membership helper
    seed-branch.ts            # a branch by (academy, name)
  profiles/
    baseline.ts
    demo/
      index.ts                 # orchestrator
      content.ts                 # courses/levels/lectures/quiz forms
      groups.ts                   # groups/sessions + the started-class fixture
      trainees.ts                  # trainees/enrollments/attendance/certificates
      data.ts                       # hand-authored literal content
    performance.ts
    showcase/                  # preview sales demo: determinism, catalog, teachers,
                               # content, cohorts, lifecycle, records, activity, plan, write
```

## Idempotency (the safety rule that matters here)

Every seed insert goes through `seedIfMissing` (`base.ts`): look up by a **stable natural key**
(email, org short code, a name scoped to its parent) first; insert only if missing; never update
or delete an existing row. Running any profile twice in a row is a no-op the second time — verified
directly (`npm run db:seed:demo` twice in a row: 245 rows the first run, 0 the second, 245 skip
lines). No profile clears data; that's `clear-db.ts`'s job alone (`npm run db:seed:clear`), and it
is never called automatically.

Rows that don't have an obvious business-meaningful name (join-table-style rows: `group_students`,
`session_students`, `enrollment_levels`) are looked up by the same column pair their database
`unique` constraint already covers — the constraint is a backstop, `seedIfMissing`'s lookup is
what makes a second run silent rather than throwing.

## Usage counters

`organizations.studentCount`/`courseCount` aren't hand-set — after a profile finishes writing
trainees/courses, it calls the same pure `countOrganizationUsage` helper the Phase 8 usage
reconciliation job uses (`src/features/core/organizations/server/usage.ts`) and writes the real
count back. A profile's seeded data and its organization's usage numbers can never drift from each
other, and reusing the helper avoids a second, parallel counting implementation.

## Audit Actor

Every seed-inserted row's `createdBy` is the single constant `SEED_SYSTEM_ACTOR` ("system:seed"),
never a user id or a freeform string — matching the audit-actor convention used elsewhere in the
app (Inngest functions use their own `system:*` actors, e.g. reconciliation's).

## Adding A New Seeded Entity

1. Add the table/migration as normal (schema-first, generated migration — same rule as everywhere
   else in this repo).
2. Add a `seedIfMissing`-based helper for it, choosing a natural key that already has (or could
   reasonably get) a `unique` constraint.
3. Wire it into whichever profile(s) it belongs in — `demo` for anything a screenshot should show,
   `performance` only if it's part of what the near-cap UI needs to demonstrate.
4. Re-run the profile twice locally and confirm the second run is all skips before opening a PR.
