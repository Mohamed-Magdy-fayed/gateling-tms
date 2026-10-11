# Academy branches + "All branches" view

Status: **proposed — awaiting Mohamed's approval** (2026-10-11)

## Decisions (from Mohamed)

- One **academy** has several **branches**. The sidebar switcher moves between branches.
- **Shared at academy level:** courses, levels, lectures, assessments (forms/questions), academy
  settings, plan/usage.
- **Per branch:** trainees, groups, classes (sessions), attendance, enrollments, level progress,
  placement tests, payments, certificates, notes, teacher availability.
- **Access:** academy owners/admins see every branch and an **All branches** view. Teachers and branch
  staff belong to specific branches and see only those.
- **Every page respects the switcher**, including All branches (lists show a Branch column/filter;
  the dashboard adds up across branches).

## Model — branches *inside* an organization

`organizations` stays the academy (the tenant). A new `branches` table hangs off it, and the per-branch
tables gain a `branchId`.

Why this way round: all 260 `ctx.organizationId` uses in 62 files keep meaning exactly what they mean
today (the academy), content stays where it is, and plan limits/usage stay per academy. The change is
*additive*: branch-scoped queries gain one more filter. The alternative (organizations become branches
under a new "business" table) would move all content up a level and touch every content query.

### Schema (generated migration + one hand-written data step)

- `branches`: `id`, `organizationId` (fk, cascade), `name`, `shortName`, `address`, `phone`,
  `isActive`, timestamps. Unique `(organizationId, name)`.
- `organization_membership_branches`: `(organizationId, userId, branchId)` PK — which branches a
  non-admin member works in. Admins need no rows (they see all).
- `branchId` (not null, fk → branches) on: `trainees`, `groups`, `sessions`, `session_students`,
  `group_students`, `enrollments`, `enrollment_levels`, `placement_tests`, `payments`,
  `certificates`, `trainee_notes`, `teacher_availability`. Composite FKs `(organizationId, branchId)`
  so a row can't point at another academy's branch. Index on `branchId` everywhere.
- **Data step (hand-written, per the migrations rule):** create one branch "Main" per existing
  organization, backfill every `branchId`, then set `NOT NULL`. Existing academies (Megz) end up with a
  single "Main" branch and behave exactly as today.

### Session + access

- Session gains `activeBranchId: string | null` (`null` = All branches).
- `orgProcedure` resolves `ctx.branchIds: string[]` — the branches this request may read:
  admin + All → every branch of the academy; admin + one branch → `[that]`; staff → their assigned
  branches ∩ the selection. Staff can never select All unless assigned to every branch.
- `ctx.writeBranchId`: required for creates. When All is selected, create forms show a **Branch**
  select (defaulting to the user's only/primary branch).
- Pure decision core (`resolveBranchAccess`) unit-tested like `resolveOrgAccess`.

### App changes

- **Switcher:** lists the active academy's branches + "All branches" (admins), grouped by academy
  when the user belongs to more than one (Mohamed: Megz, Horizon). `switchActive` takes
  `{ organizationId, branchId | null }`.
- **Every branch-scoped query** (≈32 files: trainees, groups, sessions/live classes, attendance,
  enrollments, progress, placement tests, payments, certificates, notes, availability, dashboard,
  imports/exports, Inngest jobs) adds `inArray(table.branchId, ctx.branchIds)`; every insert sets
  `branchId`. Child rows inherit their parent's branch (session ← group, enrollment ← trainee, …).
- **Lists:** Branch column + Branch filter when All is selected (hidden for a single branch).
- **Dashboard:** counts, today's classes and recent activity add up over `ctx.branchIds`; with All
  selected, a small per-branch breakdown.
- **Settings:** a Branches section (admins): add/rename/deactivate branches; assign members to
  branches on the members screen.
- **Course counts / plan limits** stay academy-wide; student count is academy-wide too (sum of branches).
- i18n EN + AR for every new string; `/ui-scan --plan` before UI work, `/ui-scan` after.

## Seeds

- `baseline` / `demo` / `performance`: each org gets a "Main" branch; demo splits across 2 branches
  so dev data exercises the switcher.
- `showcase` (Horizon), **data version 2** — the seed records its version on the org and, when the
  version changes, deletes the Horizon org and rebuilds it (one-time; nothing else is touched):
  - 3 branches: **Nasr City**, **Maadi**, **Online**.
  - ~70 teachers (~23 per branch), each with availability, spread so every working day (Sat–Thu)
    is busy in every branch.
  - Courses mostly **4–8 sessions**; groups are **private (1 student)** or **5–10 students**, random.
  - ~2,000 students over two years, plus a month+ of future classes and cohorts in placement/waiting.
  - Every feature has examples: placement tests with submissions and assigned levels, quizzes and
    finals with responses, **short-answer questions awaiting manual grading and already-graded
    ones**, certificates, payments in every method and installments, attendance (manual + Meetings,
    with lateness), notes, cancelled/postponed enrollments, cancelled classes, paused/cancelled
    groups.

## Build order

1. Schema + migration (+ backfill) — generated, verified on a throwaway Postgres 17.
2. Session/access (`activeBranchId`, `ctx.branchIds`, `resolveBranchAccess` + tests).
3. Switcher + `switchActive` + Settings → Branches + member assignment.
4. Branch filter across every branch-scoped router, feature by feature, each with tests.
5. Lists: Branch column/filter; dashboard aggregation.
6. Seeds (all profiles), showcase v2, multi-run tests on Docker.
7. Gates: typecheck, tests, build, `/ui-scan` on touched UI, then push to preview.

## Risks

- **Missed filter = cross-branch leak** (not cross-academy: `organizationId` still guards that). An
  integration test asserts every branch-scoped table's list query returns only `ctx.branchIds` rows.
- Inngest jobs and webhooks (Meetings) have no session; they resolve the branch from the row they
  act on.
- Large diff; done in the order above with a commit per step so preview can be checked midway.
