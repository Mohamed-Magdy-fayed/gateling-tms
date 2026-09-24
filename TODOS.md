# TODOS

## Billing

### Gate Gateling Meetings behind a paid TMS plan

**What:** Require a paid plan (basic+) to start a live class on Gateling Meetings.

**Why:** Meetings is Gateling's own service, and Mohamed wants it included in a paid TMS plan rather than sold as a separate subscription.

**Context:** Deferred from the academy-preferences eng review (docs/designs/academy-preferences.md, ledger R7, D4). `organizations.plan` exists, and `PLAN_LIMITS` in `src/features/core/organizations/server/limits.ts` already enforces students/courses/storage. Nothing checks the plan at class start. It must ship together with the owner plan-grant action (R8) so comped academies keep classes. Roadmap rule: spec this in the Billing & Paymob session first (docs/rebuild/05-roadmap.md item 7).

**Effort:** S
**Priority:** P2
**Depends on:** Billing & Paymob spec session; owner plan-grant action (R8)

## Design

### Write DESIGN.md for Gateling-TMS

**What:** Run /design-consultation to produce a DESIGN.md: type, color tokens, spacing, component rules, RTL rules.

**Why:** Design reviews and /ui-scan currently reverse-engineer conventions from code; a written system keeps new screens consistent as more academies onboard.

**Context:** Flagged by /plan-design-review on docs/designs/academy-preferences.md (2026-09-24, D14). Existing kit: src/components/ui (Card, Alert, EmptyState, Tag, Switch, Select, InputGroup, DataTable). Not a blocker for the academy-preferences build.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Live classes (from the month-view autoplan, docs/designs/live-classes-month-view.md)

### Drag a class to another day in the month view

**What:** Let staff drag a chip onto another day in the month grid, keeping its start time and duration.

**Why:** Rescheduling across weeks today means switching to the week view and paging.

**Context:** CEO E3, deferred 2026-09-24. Reuse `sessions.update` and the week view's optimistic `pendingPlacements` pattern; decide what happens when the target day is outside the teacher's availability (warn, as the week view does).

**Effort:** M
**Priority:** P3
**Depends on:** Month view shipped

### Printable / shareable month schedule

**What:** A print stylesheet and/or image export of the month grid for sharing in parents' WhatsApp groups.

**Why:** The reference academy is WhatsApp-first; the month schedule is what gets posted every 1st.

**Context:** CEO E4 (taste), deferred 2026-09-24. Needs an export design (print CSS vs server-rendered image) and a student-safe variant without join links.

**Effort:** M
**Priority:** P3
**Depends on:** Month view shipped

### Group filter on the calendar views

**What:** Filter week and month views by group, alongside the teacher filter.

**Why:** Coordinators plan per group ("when does B2 meet this month?").

**Context:** CEO E5, deferred 2026-09-24. Extends `weekSessionsInput`/`monthSessionsInput` and the shared `useTeacherFilter` pattern.

**Effort:** M
**Priority:** P3
**Depends on:** None

### "Groups ending this month" signal

**What:** Mark groups whose last generated session falls inside the viewed month.

**Why:** Renewals and extensions get planned before a group quietly runs out of sessions.

**Context:** CEO voice F1/E7, deferred 2026-09-24. Data exists: sessions are generated up front per `sessionCount` (`groups/server/schedule.ts`).

**Effort:** S
**Priority:** P2
**Depends on:** Month view shipped

### Calendar subscription (ICS) per teacher / student

**What:** A private ICS feed so teachers and students see their classes in Google/Apple Calendar.

**Why:** The main competitor to an in-app calendar is the calendar people already use.

**Context:** CEO voice E8, deferred 2026-09-24. Needs a revocable per-user token and a read-only route using `ownClassesOnlyForStudents` rules.

**Effort:** M
**Priority:** P2
**Depends on:** None

### Org-level week-start preference

**What:** Make Saturday-first configurable per academy (Saturday / Sunday / Monday).

**Why:** Academies outside the Saturday-first region get an odd grid in week and month views.

**Context:** CEO voice E9, deferred 2026-09-24. `WEEK_START_DAY` is hard-coded in `live-classes/sessions/lib/week.ts`; the academy preferences registry (T4-T7) is the natural home.

**Effort:** M
**Priority:** P3
**Depends on:** Academy preferences registry

### Arrow-key navigation in calendar grids

**What:** Roving-tabindex arrow-key navigation across day cells in the month grid (and blocks in the week grid).

**Why:** v1 is tab-order only; keyboard users step through every chip.

**Context:** Design review D-T1, deferred 2026-09-24.

**Effort:** S
**Priority:** P3
**Depends on:** Month view shipped

### Composite index on sessions (organization_id, scheduled_at)

**What:** Add `sessions_org_scheduled_at_idx` via `npm run db:generate`.

**Why:** Week, month and list range queries filter on both columns; today there are only single-column indexes.

**Context:** Eng review finding 8 (taste, deferred 2026-09-24): not needed at one academy's volume. Add when an org passes a few thousand sessions or the month query shows up in slow-query logs.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Completed
