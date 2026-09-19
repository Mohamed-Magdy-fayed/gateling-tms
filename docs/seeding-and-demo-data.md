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
password (`SEED_DEFAULT_PASSWORD`, see the root `README.md`'s "Seeded accounts" table). No domain
content (no courses, groups, or trainees). This is what every other profile builds on top of.

### 2. `demo`

The realistic-academy, screenshot/demo dataset. Runs `baseline` first, then adds to the *same*
organization — sign in with the documented admin/teacher accounts and the org is already full of
content, rather than needing a second login to see it:

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

## Directory Structure

```text
src/drizzle/seed/
  base.ts              # seedIfMissing — the idempotency primitive every profile uses
  clear-db.ts           # destructive, host-guarded, never called from the default flow
  cli.ts                  # npm run db:seed[:demo|:performance|:clear]
  constants.ts              # natural keys / well-known ids shared across profiles
  index.ts                   # profileRunners registry
  lib/
    seed-member.ts            # shared user+credentials+membership helper
  profiles/
    baseline.ts
    demo/
      index.ts                 # orchestrator
      content.ts                 # courses/levels/lectures/quiz forms
      groups.ts                   # groups/sessions + the started-class fixture
      trainees.ts                  # trainees/enrollments/attendance/certificates
      data.ts                       # hand-authored literal content
    performance.ts
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
