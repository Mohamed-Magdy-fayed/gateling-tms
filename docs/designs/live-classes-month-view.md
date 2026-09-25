<!-- /autoplan restore point: "C:\\Users\\moham\\.gstack\\projects\\Mohamed-Magdy-fayed-gateling-tms\\preview-autoplan-restore-20260924-211536.md" -->
# Live Classes: month view of the schedule

Request (Mohamed, 2026-09-24): "we need the schedule to also be available for all month in live classes."

## Implementation plan

### Goal

`/live-classes/sessions` shows the schedule two ways today: a Saturday-first **week** grid (drag to move/resize, teacher filter, availability paint) and a **list** agenda (upcoming/past, paged). Add a third view, **month**, so staff and students can see the whole month's classes on one screen: which days have classes, which groups, and spot gaps or overload before the month starts.

### Scope

1. **View switch.** Add `"month"` to `VIEW_VALUES` in `live-classes-page.tsx` (SegmentedControl: Week / Month / List, `CalendarIcon` for month). Kept in `?view=month` like the others.
2. **Month math in `lib/week.ts`** (pure, unit-tested next to the week math):
   - `monthStartOf(date)` → first day of the month (`YYYY-MM-01`).
   - `monthGridDates(monthStart, timeZone)` → the visible grid: from `weekStartOf(monthStart)` through the Friday that ends the week holding the last day of the month (5 or 6 rows of 7, Saturday first).
   - `monthBoundsInZone(monthStart, timeZone)` → UTC instants of the grid's first local midnight (inclusive) to the day after its last date (exclusive), via `zonedInstant` so DST is handled.
   - `addIsoMonths(date, n)` for prev/next navigation.
3. **Server: `sessions.month` query.** `monthSessionsInput = { month: z.iso.date(), teacherId?: idSchema }`. `listMonthSessions` in `queries.ts` mirrors `listWeekSessions`: loads the org zone, snaps `month` to its first day, bounds by the full visible grid (so leading/trailing days of neighbour months are filled too), same `ownClassesOnlyForStudents` and teacher filter, returns `{ monthStart, gridStart, timeZone, rows, liveClassesEnabled }`. `orgProcedure` (students see their own classes). Refactor the shared "load org zone or NOT_FOUND" + "select by range" bits out of `listWeekSessions` rather than copying them.
4. **Client: `SessionsMonthView`** (`admin/components/sessions-month-view.tsx`) + `MonthCalendar` (`admin/components/month-calendar/month-calendar.tsx`):
   - Toolbar: prev month / Today / next month (chevrons `rtl:rotate-180`), month label via `Intl.DateTimeFormat({ month: "long", year: "numeric", timeZone })`, the same teacher filter as the week view with the same `?teacher=` param (shared across views). Month kept in `?month=YYYY-MM-01`.
   - Grid: 7 weekday headers (Saturday first, localized short names), 5–6 rows. Each day cell: date number (today highlighted, days outside the month muted), up to 3 session chips (group color swatch from `groupColor`, local start time, group name, truncate), then a "+N more" button. Adjusted sessions show the same marker the week view uses; cancelled status uses the existing status styling.
   - Click a chip → the existing `SessionEditDialog` (same props as the week view).
   - Click a date number / "+N more" → switch to `?view=week&week=<weekStartOf(date)>` so the day is visible in the full grid.
   - Mobile (< md): the grid collapses to a day-by-day list of only days with classes (reuse the agenda's per-day `Card` + `SessionList`), because 7 columns of chips don't fit at 375px.
   - Loading: skeleton of grid height; empty month: `EmptyState` "No classes this month."
   - No drag-and-drop in month view (v1); moving is done in the week view or the edit dialog.
5. **i18n (en + ar):** `sessions.view.month`, `sessions.month.{previousMonth,nextMonth,today,emptyMonth,more ("+{count} more"),openDay}`.
6. **Tests:** `tests/sessions-week.test.ts` gains month-math cases (month starting on Saturday → 5 rows; 31-day month starting Friday → 6 rows; Feb in a leap year; DST bounds in Cairo; year rollover for `addIsoMonths`). A query test for `listMonthSessions` if the week query has one in the integration suite (student visibility + teacher filter + grid bounds).

### Out of scope

- Drag-and-drop in the month grid.
- Availability painting in month view.
- Generating/extending group sessions for the month (the schedule generator is unchanged).


<!-- autoplan-accepted:ceo -->
- Month view is a third view (`?view=month`) on `/live-classes/sessions`, read-only (no drag), visible to every member; students see only their own classes (same `ownClassesOnlyForStudents` rule as week/list). Verify: integration test that a student's `sessions.month` returns only their groups' sessions.
- `sessions.month` bounds cover the full visible grid (Saturday before the 1st through the Friday after the last day), computed in the academy zone via `zonedInstant`, DST-safe. Verify: unit tests for 5-row and 6-row months, leap February, a Cairo DST-transition month, year rollover in `addIsoMonths`.
- `?month=` accepts any date and snaps to the first of its month server-side (bookmarks never error); `?teacher=` is shared with the week view. Verify: unit test for `monthStartOf` on mid-month and last-day inputs.
- E1: `tests/integration/org-isolation.test.ts` gains `sessions.week` and `sessions.month` cases proving org A never sees org B's sessions. Verify: `npm run test:integration` (or the repo's integration command) passes.
- E2: month header shows the count of classes in the month (excluding leading/trailing neighbour-month days), honoring the teacher filter. Verify: component/unit test of the count helper.
- E6: teacher filter (members query, staff-only options, `?teacher=` param, reset of paint mode) extracted to one hook used by both week and month views; week view behavior unchanged. Verify: typecheck + existing week behaviors manually unchanged.
- Deferred to TODOS.md: E3 month drag-and-drop, E4 printable/shareable month, E5 group filter.
- Spec review 1 (replaces the E1 verify command above): the isolation command is `npm run test:isolation`. The `sessions.week` / `sessions.month` isolation cases pin `weekStart: "2026-08-29"` and `month: "2026-09-01"` (the fixture session sits at `2026-09-01T18:00Z`, `tests/integration/lib/tenant-fixtures.ts:241`) and assert org A's own `dataA.sessionId` IS present (positive control) and org B's is not.
- Spec review 1: the student-visibility integration test creates a `student` member whose trainee record (`trainees.userId`) is on group A, plus a second group in the same org with its own session; `sessions.month` as that student returns group A's session and not the other group's. Scope item 6's "if the week query has one" condition is removed: this test is required.
- Spec review 1 (replaces "bookmarks never error" above): the client validates `?month=` with `parseIsoDate`; anything unparseable falls back to the current month in the academy zone and is never sent. Valid dates snap to the 1st server-side. Verify: unit test of the client param parser on `2026-13-01`, `abc`, `2026-09-17`.
- Spec review 1: E2's count covers in-month days only and excludes `cancelled` sessions. The empty state shows when that in-month count is 0; the grid still renders above it so neighbour-month days stay visible.
- Spec review 1: each day cell shows the earliest 3 sessions by start time (server order); "+N more" counts the rest of that day.
- Spec review 1: the mobile list shows in-month days that have at least one session, using a shared `groupByDay` moved from `sessions-agenda.tsx` into `lib/` and a `DaySessionsCard` component both the agenda and month mobile view render.
- Spec review 1 (replaces E6's "reset of paint mode"): `useTeacherFilter` owns the members query, staff-only teacher options and the `?teacher=` param, and takes an optional `onTeacherChange` callback; the week view passes one that resets its paint mode. The month view has no paint mode.
- Spec review 1: switching views carries the date anchor. Week → Month sets `month=monthStartOf(weekStart)`. Month → Week sets `week=weekStartOf(today)` when today is in the viewed month, else `weekStartOf(monthStart)`. Verify: unit test of the anchor helper.
- Spec review 1: the server response's `monthStart` / `gridStart` are the source of truth for drawing the grid (same pattern as `data.weekStart`); the client computes grid dates only from those values.
- Spec review 2: i18n adds `sessions.month.classCount` in `en.ts` and `ar.ts` using the existing `dt("{count:plural} …", { plural: … })` pattern (`en.ts:91`), so Arabic gets its plural forms.
- Spec review 2: the student-visibility test lives in a new `tests/integration/sessions-visibility.test.ts`: `createMember(orgA, "student")`, insert a trainee with that `userId` plus a `group_students` row on `dataA.groupId`, insert a second group with its own session, call `sessions.month({ month: "2026-09-01" })` and `sessions.week({ weekStart: "2026-08-29" })` as the student, expect group A's session only; `destroyMember` in `afterAll`.
- Spec review 2: the shared day grouping helper (`lib/day-groups.ts#groupByDay`) returns `{ date: IsoDate, label, sessions }[]`, with `date` from `zonedParts(scheduledAt, timeZone).date`; the agenda keeps its label rendering, and the month mobile view filters on `date`.
- Spec review 2: `lib/view-anchor.ts#viewAnchorParams(from, to, params, today, timeZone)` is pure; on switch it sets the target view's `week`/`month` param and deletes the other view's; `LiveClassesPage` reads the zone from the cached `trpc.organizations.getActive` query. The `?month=` parser (`parseMonthParam`) and the in-month count helper (`countInMonth`) live in `lib/week.ts`. All four helpers are unit-tested in `tests/sessions-week.test.ts`.
- Spec review 3: in `sessions-visibility.test.ts` the second group uses `courseId: dataA.courseId` and its session is at `2026-09-02T18:00:00Z` (inside both the pinned week and month); a control call as the org A admin asserts BOTH sessions are returned before the student assertion.
- Spec review 3 (replaces the Week → Month rule above): Week → Month uses today's month when today falls in the viewed week, else the month holding that week's Thursday (4 of its 7 days); when `?week=` is absent it deletes `month` (current month). `list` neither sets nor deletes `week`/`month`. Unit-tested cases include week 2026-08-29 with today 2026-09-02 → September.
- Spec review 3: clicking a date number or "+N more" sets `view=week`, `week=weekStartOf(clickedDate, timeZone)` and deletes `month`, without going through `viewAnchorParams`.
- Spec review 3: `sessions.month.more` uses the same `dt` plural pattern as `classCount` in both `en.ts` and `ar.ts`.
- Spec review 3: `parseMonthParam` rejects out-of-range dates via round-trip (`addIsoDays(value, 0) === value`), so `2026-13-01` and `2026-02-30` fall back to the current month. Both are in the unit test.
- CEO voice F1: each in-month day cell shows its class count (excluding cancelled) when it has more than 3 sessions, next to the date number, and a warning marker when two non-cancelled sessions of the same teacher overlap in time that day (computed client-side from `rows`, helper `findTeacherOverlaps` in `lib/week.ts`, unit-tested: back-to-back is not an overlap, cancelled is ignored, null teacher is ignored). The marker has an accessible label naming the teacher.
- CEO voice F3: status/adjusted/group-color styling moves out of `session-block.tsx` into one shared `sessionAppearance(session)` helper (`admin/components/session-appearance.ts`) used by the week block and the month chip; week rendering is unchanged.
- CEO voice F4: the plan Goal records why a month grid: the academy asked to see the whole month's schedule; load/timeline views are follow-ups (TODOS).
- CEO voice F7: ship in two commits: (1) lib helpers + tests + `sessions.month` query + isolation/visibility tests; (2) UI, shared hooks/components, view switching, i18n.
- Deferred to TODOS.md (CEO voice): E7 "groups ending this month" signal, E8 per-teacher/student calendar subscription (ICS), E9 org-level week-start preference (Saturday stays hard-coded in v1).
- CEO Section 2: the month view shows an error `Alert` with a Retry button when `sessions.month` fails (never an endless skeleton); the week view gets the same treatment for `sessions.week`. i18n: `sessions.calendar.loadFailed`, `sessions.calendar.retry` (en + ar).
- CEO Section 6: the visibility test also asserts a student member with no trainee record gets zero rows from `sessions.month`, not an error.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- Month label is the view heading (`H3`, locale-aware `Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone })`) with the in-month class count as muted text under it; toolbar row 2: prev / Today / next on the leading side, teacher filter on the trailing side (full width below `sm`).
- Empty in-month state is an inline notice between toolbar and weekday headers (not an `EmptyState` below the grid): "No classes this month." or, with a teacher filter, "No classes for {name} this month." plus a "Clear filter" button. Below `lg` the full `EmptyState` with the same text is used. i18n keys `sessions.month.emptyMonth`, `sessions.month.emptyForTeacher`, `sessions.month.clearFilter` (en + ar).
- (Replaces CEO F1's per-day count badge) Each day cell shows at most 3 chips: non-cancelled sessions first in start order, then cancelled; "+N more" counts every remaining session of that day. There is no separate per-day count badge. The same-teacher overlap marker from CEO F1 stays.
- "+N more" opens a `Popover` showing that day's `DaySessionsCard` with an "Open in week view" link; the date number goes to the week view (spec review 3 rule); clicking empty cell space does nothing.
- The grid renders at `lg` and up; below `lg` the per-day list is shown instead (replaces the `md` breakpoint in scope item 4).
- Grid semantics: `<table>` with `<th scope="col">` localized weekday headers; each day cell labelled with the full localized date; chips are `<button>` elements named "{group}, {time}, {status}" plus "adjusted" when adjusted; "+N more" named via `sessions.month.openDay` ("{count} more classes on {date}"); tab order row by row; no arrow-key navigation in v1.
- Overlap marker: `AlertTriangleIcon` `size-3.5 text-warning` on the trailing side of the date row, rendered as a `<button>` with an accessible label naming the teacher, opening a `Popover` listing the clashing classes; the clashing chips get `ring-1 ring-warning`. On the mobile list the marker appears on the `DaySessionsCard` header.
- When `liveClassesEnabled` is false the month view shows the agenda's `sessions.notConfiguredNotice` `Alert` above the grid.
- All formatters (month label, weekday headers, day numbers, chip times with `timeStyle: "short"`) take the current i18n locale and the academy `timeZone`; "today" is computed in the academy zone; the table follows `dir` (Saturday is the rightmost column in Arabic).
- Loading: grid-height `Skeleton` on first load only; on month or teacher change the previous month stays visible at `opacity-60` with chips disabled until data arrives (`placeholderData: keepPreviousData`).
- Neighbour-month days: date number `text-muted-foreground`, chips at `opacity-60`, still clickable, excluded from counts and overlap markers.
- Mobile: "Today" scrolls to today's card or the next day with classes. Known limitation (documented in plan): the mobile list hides days without classes.
- Today's date number uses `bg-primary text-primary-foreground` in a small rounded badge.
- Implementation follows the UI gate in CLAUDE.md: `/ui-scan --plan` before writing UI, `/ui-scan` on every touched UI file after, fixing all critical/major before `typecheck && build`.
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:eng -->
- M1: `listMembersInput` gains optional `roles: z.array(z.enum(organizationMembershipRoleValues)).optional()`, applied as a WHERE in the members query; `useTeacherFilter` requests `roles: ["admin", "teacher"]` so teachers are never lost past 100 members. Verify: integration test that `members.list({ roles: ["admin","teacher"] })` excludes a student member.
- (Replaces spec review 3's Thursday rule) Week → Month uses today's month when today falls in the viewed week, else the month of the week's 4th day, `addIsoDays(weekStart, 3)`. Unit tests: week 2026-09-26 (today outside) → September; week 2026-08-29 with today 2026-09-02 → September; week 2026-08-29 with today outside → September.
- (Replaces "5 or 6 rows") `monthGridDates` returns 4, 5 or 6 whole weeks; row count is `dates.length / 7`; the skeleton uses a fixed min-height, not a row count. Unit test: February 2025 → 4 rows; Saturday-starting 31-day month → 5 rows; 31-day month starting Friday → 6 rows.
- `month` is optional in `monthSessionsInput`; when omitted the server uses today in the academy zone. The client sends `month` only when `?month=` parses; the H3 label and class count come from the response's `monthStart`, not the URL. Verify: integration test that omitting `month` returns the current academy-zone month.
- While `isPlaceholderData` is true the header and grid are dimmed together; when `isError` is true the error `Alert` + Retry shows even if placeholder data is displayed.
- `parseMonthParam` requires `parseIsoDate(value) !== null` before the round-trip check; unit tests include `abc`, `2026-13-01`, `2026-02-30`, `2026-09-17`.
- DST tests add `America/Santiago` (midnight transition) alongside Cairo, asserting grid bounds equal `zonedInstant(edge, 0)` and that every `monthGridDates` entry is unique and consecutive.
- All day bucketing (in-month count, chips, overlaps, mobile filter) uses the academy zone via `zonedParts` / `groupByDay`; `findTeacherOverlaps` is a per-teacher sort-and-sweep over the whole month and marks every day an overlap touches (including sessions crossing local midnight). Unit test: a 23:30-local session buckets to its local day.
- The server response includes `gridEnd` (exclusive) alongside `gridStart` and `monthStart`.
- The overlap marker renders only for staff (`role !== "student"`).
- Clicking a chip inside the "+N more" popover closes the popover, then opens `SessionEditDialog`; focus returns to the "+N more" trigger when the dialog closes; students get the same read-only dialog as the week view.
- Week-view regression contract: behavior unchanged after `useTeacherFilter` and `sessionAppearance` extraction; `tests/sessions-week.test.ts` stays green; manual check of drag, resize, paint-mode reset on teacher change, availability overlay and status styling.
- Complexity gate: original file arrangement kept (autoplan never-reduce override).
- Deferred to TODOS.md: composite `(organization_id, scheduled_at)` index (eng #8, taste).
- Gates before push: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:isolation` (throwaway postgres:17 per local tooling notes), `npm run build` (with dummy env overrides), then commit and push to `preview`.
<!-- /autoplan-accepted:eng -->
## Review record

_Filled by /autoplan._

### Phase 0 intake

- Source plan SHA `cefcd782…e8ba8`, restore point `C:\Users\moham\.gstack\projects\Mohamed-Magdy-fayed-gateling-tms\preview-autoplan-restore-20260924-211536.md`.
- UI scope: **yes** (view switch, calendar grid, dialog, mobile layout). DX scope: **no** (snapshot scope: 1 term match "integration", threshold 2, not a developer tool, not agent-primary).
- Outside voice: Codex `not_installed` → Claude subagent fallback only; outside coverage **unavailable** for every phase.

### CEO — Step 0 (mode: SELECTIVE EXPANSION, autoplan override)

**System audit.** `preview` is clean apart from this plan; the last 10 commits are the academy-preferences work (T2–T7), which doesn't touch `live-classes/`. TODOS.md has one live-classes item (plan-gated class start), and this plan doesn't depend on it. Relevant code: `sessions-week-view.tsx` (455 lines, owns URL state + queries + mutations), `week-calendar/*` (pure drawing), `lib/week.ts` (zone-safe date math, fully unit tested in `tests/sessions-week.test.ts`), `server/queries.ts#listWeekSessions`. `sessions_scheduled_at_idx` and `sessions_organization_id_idx` exist. `tests/integration/org-isolation.test.ts` covers `sessions.list`/`byGroup`/`startMeeting` but **not `sessions.week`**.

**Taste calibration.** Good references: `lib/week.ts` (pure, DST-safe, documented), `sessions-week-view.tsx` (URL-as-state, container/presentational split), `session-block.tsx` (status styling + adjusted marker). Avoid: growing `sessions-week-view.tsx` further (already 455 lines; the month view must not be bolted into it).

**Landscape.** Every scheduling incumbent (Teach 'n Go, Teachworks, Google Calendar) offers Day/Week/Month; month is the planning view, week is the editing view. Layer 3: for a WhatsApp-first academy the month view is also what gets screenshotted and shared with parents, so legibility at a glance (group name + time per chip) beats density.

**0A Premise challenge.**
- P1 "all month" means a *month view* of existing sessions. Evidence: sessions are already generated for the whole group term by `regenerateGroupSessions`; nothing limits the data to a week, only the UI does. Alternative reading ("generate sessions a month ahead") is not supported by the code, since generation already covers the term. **Accepted (P6)**, flagged for the final gate as a confirm-intent item.
- P2 Students need the month view too. The week query already allows students (own classes only), so the month query must keep `ownClassesOnlyForStudents`. **Accepted.**
- P3 Read-only month grid is enough for v1. Moving classes is a week-view job with minute precision; month cells carry no time axis. **Accepted.**
- Do-nothing cost: staff page through 4–5 weeks to answer "does Sara have classes on the 18th?" or "which groups still have sessions after the 20th?"; the list view pages 20 rows at a time and is upcoming-only.

**0B Existing code leverage.**
| Sub-problem | Existing code | Reuse |
|---|---|---|
| Zone-safe date math | `lib/week.ts` (`addIsoDays`, `weekStartOf`, `zonedInstant`, `zonedParts`, `todayInZone`) | extend in place |
| Range query + student visibility | `queries.ts#listWeekSessions`, `ownClassesOnlyForStudents`, `selectSessions` | extract shared range loader |
| Group colors | `week-calendar/group-colors.ts#groupColor` | reuse |
| Status/adjusted styling | `session-block.tsx`, `session-status-tag.tsx` | reuse classes |
| Session details + edit | `session-edit-dialog.tsx` | reuse as-is |
| Teacher filter + options | inline in `sessions-week-view.tsx` | extract `useTeacherFilter` hook |
| Mobile per-day list | `sessions-agenda.tsx#groupByDay` + `SessionList` | extract `groupByDay` to lib, reuse |

**0C Dream state.**
```
CURRENT                         THIS PLAN                          12-MONTH IDEAL
week grid (edit) + list    ---> + month grid (plan/overview),  ---> day/week/month/list, filters by
(20/page, upcoming only)        shared teacher filter,              teacher/group/room, drag across
                                mobile per-day fallback              days, shareable/printable month
```

**0E Mode.** SELECTIVE EXPANSION (autoplan override). ~9 files touched (2 new components, 1 new hook, lib, queries, router, schemas, page, i18n ×2, tests ×2).

**0F/0G Expansion candidates (auto-decided).**
| # | Proposal | Effort | Decision | Reason |
|---|---|---|---|---|
| E1 | Add `sessions.week` and `sessions.month` to the org-isolation integration suite | S | ACCEPTED | P2: in blast radius, closes an existing gap the new query would copy |
| E2 | Month header summary: "N classes this month" (respects teacher filter) | S | ACCEPTED | P2: <1h, answers the planning question directly |
| E3 | Drag a class to another day in the month grid | M | DEFERRED (TODOS) | P3: week view already moves classes; needs time-preserving drop rules |
| E4 | Printable / shareable month schedule (for WhatsApp groups) | M | DEFERRED (TODOS), TASTE | Fits the WhatsApp-first thesis, but needs print CSS and an export design |
| E5 | Group filter on week + month views | M | DEFERRED (TODOS) | P3: new filter touches both views and the query contract |
| E6 | Extract teacher-filter logic out of `sessions-week-view.tsx` into a shared hook | S | ACCEPTED | P4 DRY: month view needs the identical members query, option list and `?teacher=` param |

<!-- autoplan-accepted:ceo -->
- Month view is a third view (`?view=month`) on `/live-classes/sessions`, read-only (no drag), visible to every member; students see only their own classes (same `ownClassesOnlyForStudents` rule as week/list). Verify: integration test that a student's `sessions.month` returns only their groups' sessions.
- `sessions.month` bounds cover the full visible grid (Saturday before the 1st through the Friday after the last day), computed in the academy zone via `zonedInstant`, DST-safe. Verify: unit tests for 5-row and 6-row months, leap February, a Cairo DST-transition month, year rollover in `addIsoMonths`.
- `?month=` accepts any date and snaps to the first of its month server-side (bookmarks never error); `?teacher=` is shared with the week view. Verify: unit test for `monthStartOf` on mid-month and last-day inputs.
- E1: `tests/integration/org-isolation.test.ts` gains `sessions.week` and `sessions.month` cases proving org A never sees org B's sessions. Verify: `npm run test:integration` (or the repo's integration command) passes.
- E2: month header shows the count of classes in the month (excluding leading/trailing neighbour-month days), honoring the teacher filter. Verify: component/unit test of the count helper.
- E6: teacher filter (members query, staff-only options, `?teacher=` param, reset of paint mode) extracted to one hook used by both week and month views; week view behavior unchanged. Verify: typecheck + existing week behaviors manually unchanged.
- Deferred to TODOS.md: E3 month drag-and-drop, E4 printable/shareable month, E5 group filter.
- Spec review 1 (replaces the E1 verify command above): the isolation command is `npm run test:isolation`. The `sessions.week` / `sessions.month` isolation cases pin `weekStart: "2026-08-29"` and `month: "2026-09-01"` (the fixture session sits at `2026-09-01T18:00Z`, `tests/integration/lib/tenant-fixtures.ts:241`) and assert org A's own `dataA.sessionId` IS present (positive control) and org B's is not.
- Spec review 1: the student-visibility integration test creates a `student` member whose trainee record (`trainees.userId`) is on group A, plus a second group in the same org with its own session; `sessions.month` as that student returns group A's session and not the other group's. Scope item 6's "if the week query has one" condition is removed: this test is required.
- Spec review 1 (replaces "bookmarks never error" above): the client validates `?month=` with `parseIsoDate`; anything unparseable falls back to the current month in the academy zone and is never sent. Valid dates snap to the 1st server-side. Verify: unit test of the client param parser on `2026-13-01`, `abc`, `2026-09-17`.
- Spec review 1: E2's count covers in-month days only and excludes `cancelled` sessions. The empty state shows when that in-month count is 0; the grid still renders above it so neighbour-month days stay visible.
- Spec review 1: each day cell shows the earliest 3 sessions by start time (server order); "+N more" counts the rest of that day.
- Spec review 1: the mobile list shows in-month days that have at least one session, using a shared `groupByDay` moved from `sessions-agenda.tsx` into `lib/` and a `DaySessionsCard` component both the agenda and month mobile view render.
- Spec review 1 (replaces E6's "reset of paint mode"): `useTeacherFilter` owns the members query, staff-only teacher options and the `?teacher=` param, and takes an optional `onTeacherChange` callback; the week view passes one that resets its paint mode. The month view has no paint mode.
- Spec review 1: switching views carries the date anchor. Week → Month sets `month=monthStartOf(weekStart)`. Month → Week sets `week=weekStartOf(today)` when today is in the viewed month, else `weekStartOf(monthStart)`. Verify: unit test of the anchor helper.
- Spec review 1: the server response's `monthStart` / `gridStart` are the source of truth for drawing the grid (same pattern as `data.weekStart`); the client computes grid dates only from those values.
- Spec review 2: i18n adds `sessions.month.classCount` in `en.ts` and `ar.ts` using the existing `dt("{count:plural} …", { plural: … })` pattern (`en.ts:91`), so Arabic gets its plural forms.
- Spec review 2: the student-visibility test lives in a new `tests/integration/sessions-visibility.test.ts`: `createMember(orgA, "student")`, insert a trainee with that `userId` plus a `group_students` row on `dataA.groupId`, insert a second group with its own session, call `sessions.month({ month: "2026-09-01" })` and `sessions.week({ weekStart: "2026-08-29" })` as the student, expect group A's session only; `destroyMember` in `afterAll`.
- Spec review 2: the shared day grouping helper (`lib/day-groups.ts#groupByDay`) returns `{ date: IsoDate, label, sessions }[]`, with `date` from `zonedParts(scheduledAt, timeZone).date`; the agenda keeps its label rendering, and the month mobile view filters on `date`.
- Spec review 2: `lib/view-anchor.ts#viewAnchorParams(from, to, params, today, timeZone)` is pure; on switch it sets the target view's `week`/`month` param and deletes the other view's; `LiveClassesPage` reads the zone from the cached `trpc.organizations.getActive` query. The `?month=` parser (`parseMonthParam`) and the in-month count helper (`countInMonth`) live in `lib/week.ts`. All four helpers are unit-tested in `tests/sessions-week.test.ts`.
- Spec review 3: in `sessions-visibility.test.ts` the second group uses `courseId: dataA.courseId` and its session is at `2026-09-02T18:00:00Z` (inside both the pinned week and month); a control call as the org A admin asserts BOTH sessions are returned before the student assertion.
- Spec review 3 (replaces the Week → Month rule above): Week → Month uses today's month when today falls in the viewed week, else the month holding that week's Thursday (4 of its 7 days); when `?week=` is absent it deletes `month` (current month). `list` neither sets nor deletes `week`/`month`. Unit-tested cases include week 2026-08-29 with today 2026-09-02 → September.
- Spec review 3: clicking a date number or "+N more" sets `view=week`, `week=weekStartOf(clickedDate, timeZone)` and deletes `month`, without going through `viewAnchorParams`.
- Spec review 3: `sessions.month.more` uses the same `dt` plural pattern as `classCount` in both `en.ts` and `ar.ts`.
- Spec review 3: `parseMonthParam` rejects out-of-range dates via round-trip (`addIsoDays(value, 0) === value`), so `2026-13-01` and `2026-02-30` fall back to the current month. Both are in the unit test.
- CEO voice F1: each in-month day cell shows its class count (excluding cancelled) when it has more than 3 sessions, next to the date number, and a warning marker when two non-cancelled sessions of the same teacher overlap in time that day (computed client-side from `rows`, helper `findTeacherOverlaps` in `lib/week.ts`, unit-tested: back-to-back is not an overlap, cancelled is ignored, null teacher is ignored). The marker has an accessible label naming the teacher.
- CEO voice F3: status/adjusted/group-color styling moves out of `session-block.tsx` into one shared `sessionAppearance(session)` helper (`admin/components/session-appearance.ts`) used by the week block and the month chip; week rendering is unchanged.
- CEO voice F4: the plan Goal records why a month grid: the academy asked to see the whole month's schedule; load/timeline views are follow-ups (TODOS).
- CEO voice F7: ship in two commits: (1) lib helpers + tests + `sessions.month` query + isolation/visibility tests; (2) UI, shared hooks/components, view switching, i18n.
- Deferred to TODOS.md (CEO voice): E7 "groups ending this month" signal, E8 per-teacher/student calendar subscription (ICS), E9 org-level week-start preference (Saturday stays hard-coded in v1).
- CEO Section 2: the month view shows an error `Alert` with a Retry button when `sessions.month` fails (never an endless skeleton); the week view gets the same treatment for `sessions.week`. i18n: `sessions.calendar.loadFailed`, `sessions.calendar.retry` (en + ar).
- CEO Section 6: the visibility test also asserts a student member with no trainee record gets zero rows from `sessions.month`, not an error.
<!-- /autoplan-accepted:ceo -->

### CEO — dual voices

- Native CEO subagent: completed, `INPUT: ceo 9195e5ec…6de4` matches the bound snapshot. 7 findings (0 critical, 1 high, 6 medium).
- Outside voice (Codex): **unavailable** (CLI not installed). Tag: `[subagent-only]`.

```
CEO DUAL VOICES — CONSENSUS TABLE:
  Dimension                            Claude  Codex  Consensus
  1. Premises valid?                    mostly  —      N/A (goal overclaimed "overload"; fixed by F1)
  2. Right problem to solve?            yes     —      N/A
  3. Scope calibration correct?         grown   —      N/A (two-commit split, F7)
  4. Alternatives sufficiently explored? no     —      N/A (rationale recorded, F4)
  5. Competitive/market risks covered?  partly  —      N/A (ICS deferred E8)
  6. 6-month trajectory sound?          at risk —      N/A (shared appearance helper, F3)
Outside unavailable: every Consensus cell N/A, never CONFIRMED.
```

### CEO — 0I temporal interrogation

```
HOUR 1 (foundations):   lib/week.ts month helpers + tests; the academy zone is the only clock.
HOUR 2-3 (core):        listMonthSessions via a shared range loader; sessions.month route; isolation + visibility tests.
HOUR 4-5 (integration): useTeacherFilter extraction without regressing week paint mode; view-anchor switching; groupByDay move.
HOUR 6+ (polish):       month grid + chips + overlap marker, mobile DaySessionsCard list, en/ar plurals, RTL check.
Effort: human ~3 days / CC ~2-3 hours. No feasibility blockers.
```

### CEO — Review Sections

**Section 1 Architecture.** Current scope: SELECTIVE EXPANSION; accepted E1, E2, E6, spec-review fixes 1-3, voice F1/F3/F4/F7, Section 2 error state; deferred E3, E4, E5, E7, E8, E9.

```
 live-classes-page.tsx ──view=week──> SessionsWeekView ──> WeekCalendar ──> SessionBlock ─┐
        │ (viewAnchorParams)           │ useTeacherFilter                                  ├─> sessionAppearance()
        ├──view=month─> SessionsMonthView ──> MonthCalendar ──> MonthChip ────────────────┘
        │                     │ useTeacherFilter, SessionEditDialog, DaySessionsCard (mobile)
        └──view=list──> SessionsAgenda ──> DaySessionsCard ──> SessionList
 tRPC: sessions.week ─┐
       sessions.month ┴─> loadRangeSessions(ctx, bounds, teacherId) ─> selectSessions + ownClassesOnlyForStudents
 lib: week.ts (month helpers, parseMonthParam, countInMonth, findTeacherOverlaps) · view-anchor.ts · day-groups.ts
```

Data flow: happy (rows drawn in grid); nil (`?month` absent → current month); empty (0 rows → grid + EmptyState); error (query fails → Section 2). No new state machine; the session status machine is untouched. Coupling: the week view gives code to two shared modules, justified by reuse. Scale: 42 days max; a 50-group academy at 3 classes/week/group is ~650 rows per month, one indexed range query. Security: one new read endpoint with the same procedure and visibility rule as `sessions.week`. Rollback: additive UI + read query; reverting commit 2 hides the view, commit 1 is inert. No blocking issues.

**Section 2 Error & Rescue Map.**

```
METHOD/CODEPATH           | WHAT CAN GO WRONG                  | ERROR
listMonthSessions         | org row missing                    | TRPCError NOT_FOUND
                          | month malformed (client bypassed)  | zod BAD_REQUEST (groups.validation.date)
                          | zone bounds invalid                | TRPCError BAD_REQUEST
                          | DB failure                         | INTERNAL_SERVER_ERROR
parseMonthParam (client)  | junk / out-of-range param          | none: falls back to current month
findTeacherOverlaps       | null teacher / cancelled rows      | none: skipped by rule
SessionsMonthView query   | network/server error               | react-query error state

ERROR                   | RESCUED? | ACTION                                   | USER SEES
NOT_FOUND / BAD_REQUEST | Y        | tRPC error surfaced                      | Alert with translated message
DB / network error      | Y        | react-query error → Alert + Retry        | "Couldn't load the schedule" + Retry
```

GAP found and fixed: the plan had no error state for the month query, and the week view shows a skeleton forever on error today. Accepted: error Alert + Retry on both views (blast radius, P2).

**Section 3 Security.** New surface: `sessions.month` (read). Inputs: `month` (zod ISO date), `teacherId` (idSchema, optional). Authorization: `orgProcedure` + `eq(organizationId)` + `ownClassesOnlyForStudents`; the teacher filter only narrows. IDOR covered by the org-isolation and student-visibility tests. No secrets, no new dependencies, no PII beyond names the week view already shows. Threat: a student enumerating other groups' classes — likelihood Low, impact Medium, mitigated and tested. No open issues.

**Section 4 Data flow & interaction edges.**

```
?month -> parseMonthParam -> sessions.month -> monthStartOf (server) -> bounds (academy zone) -> rows -> MonthCalendar
  junk ──> current month           DST month: 23/25-hour day handled by zonedInstant
```

| Interaction | Edge case | Handled? | How |
|---|---|---|---|
| prev/next month | rapid clicks | Y | router.replace; react-query keyed by month |
| teacher filter | teacher removed from org | Y | stale id returns 0 rows; select falls back to "All teachers" label |
| day with 12 classes | overflow | Y | 3 chips + count badge + "+9 more" → week view |
| edit dialog save | class moved to another month | Y | invalidating `sessions.pathKey()` refetches the month |
| view switch | anchor across a month boundary | Y | Thursday rule (spec review 3) |
| late-evening class | viewer in another zone | Y | grid positions by academy zone (`zonedParts`) |

No async ordering hazards: the view is read-only and the one mutation (edit dialog) already invalidates by path key.

**Section 5 Code quality.** `sessions-week-view.tsx` is 455 lines today; E6 and F3 shrink it. Week and month queries share `loadRangeSessions`, so nothing is copied. `findTeacherOverlaps` stays under 5 branches. Naming follows `lib/week.ts`. No further issues.

**Section 6 Tests.**

```
NEW THING                                        | TYPE        | WHERE
month helpers, parser, count, overlaps, anchor   | unit        | tests/sessions-week.test.ts
sessions.week + sessions.month isolation         | integration | tests/integration/org-isolation.test.ts
student visibility (week + month, no-trainee)    | integration | tests/integration/sessions-visibility.test.ts
month grid render, chips, mobile list            | manual      | /ui-scan + Mohamed's visual check
error state + Retry                              | manual      | offline in devtools
```

Gap found and accepted: a student with no trainee record must get zero rows, not an error. All dates in tests are pinned; no `Date.now()` in assertions.

**Section 7 Performance.** One query per month view, served by `sessions_scheduled_at_idx` and `sessions_organization_id_idx`; groups and teachers joined, no N+1. `liveClassesEnabled` costs one settings read, same as week. Client grouping is O(rows). No issues.

**Section 8 Observability.** Read-only view with no jobs; failures go through the existing tRPC error logging. No new logging needed.

**Section 9 Deploy.** No migration, no env var, no flag. Vercel build runs migrate (no-op) then `next build`. Rollout: push to `preview` (tmstest.gateling.com), check month/week/list in en + ar, then PR to master. Rollback: revert the UI commit. No risks.

**Section 10 Trajectory.** Reversibility 5/5. Debt: Saturday-first is hard-coded in one more helper (E9). Follow-ups E7/E8 build on `loadRangeSessions` and the month helpers.

**Section 11 Design.**

```
[Week]──tab──>[Month grid]──chip──>[Edit dialog]──save──>[Month grid refetched]
                  │ date / "+N" ──> [Week view at that week]
                  │ < md ──> [Per-day cards, in-month days only]
```

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Month grid | grid-height skeleton | grid + EmptyState | Alert + Retry | chips | days with >3 → count + "+N" |

Deep review runs in Phase 2.

### CEO — Required outputs

**NOT in scope.** Deferred to TODOS.md: E3 month drag-and-drop; E4 printable/shareable month; E5 group filter; E7 groups-ending signal; E8 ICS subscription; E9 org week-start preference. Rejected: none.

**What already exists.** See the 0B table: `lib/week.ts`, `listWeekSessions` / `selectSessions` / `ownClassesOnlyForStudents`, `groupColor`, `session-block.tsx` styling, `SessionEditDialog`, `SessionList`, the agenda's `groupByDay`. All reused.

**Dream state delta.** After this plan: week, month and list exist; filtering by teacher only; month is read-only. Still missing vs the 12-month ideal: group/room filters, cross-day drag, print/share, subscriptions, load intelligence.

**Failure Modes Registry.**

```
CODEPATH           | FAILURE MODE              | RESCUED? | TEST? | USER SEES            | LOGGED?
listMonthSessions  | org missing               | Y        | N     | error Alert          | Y (tRPC)
listMonthSessions  | DB error                  | Y        | N     | error Alert + Retry  | Y
month bounds       | DST month off by an hour  | Y        | Y     | correct grid         | n/a
parseMonthParam    | junk param                | Y        | Y     | current month        | n/a
student visibility | leak of other groups      | Y        | Y     | only own classes     | n/a
week view query    | error → endless skeleton  | Y (fix)  | N     | error Alert + Retry  | Y
```

0 critical gaps.

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | SELECTIVE EXPANSION                         |
  | System Audit         | week query lacks isolation test; week view  |
  |                      | has no error state; 455-line week view      |
  | Step 0               | 3 premises accepted; 3 of 6 expansions in   |
  | Section 1  (Arch)    | 0 issues found                              |
  | Section 2  (Errors)  | 7 error paths mapped, 1 GAP (fixed)         |
  | Section 3  (Security)| 0 issues found, 0 High severity             |
  | Section 4  (Data/UX) | 6 edge cases mapped, 0 unhandled            |
  | Section 5  (Quality) | 0 issues found                              |
  | Section 6  (Tests)   | Diagram produced, 1 gap (fixed)             |
  | Section 7  (Perf)    | 0 issues found                              |
  | Section 8  (Observ)  | 0 gaps found                                |
  | Section 9  (Deploy)  | 0 risks flagged                             |
  | Section 10 (Future)  | Reversibility: 5/5, debt items: 1           |
  | Section 11 (Design)  | 0 issues (deep review in Phase 2)           |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (6 items)                           |
  | What already exists  | written                                     |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 7 rows, 0 CRITICAL GAPS                     |
  | Failure modes        | 6 total, 0 CRITICAL GAPS                    |
  | TODOS.md updates     | 6 items proposed                            |
  | Scope proposals      | 6 proposed, 3 accepted                      |
  | CEO plan             | written (ceo-plans/2026-09-24-live-...)     |
  | Outside voice        | codex unavailable (not installed)           |
  | Lake Score           | N/A                                         |
  | Diagrams produced    | 4 (architecture, data flow, error, UI flow) |
  | Stale diagrams found | 0                                           |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```

<!-- AUTONOMOUS DECISION LOG -->
### Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | "All month" = month view of existing sessions | Mechanical (confirm at gate) | P6 | Sessions are already generated for the whole term | generate a month ahead |
| 2 | CEO | Mode SELECTIVE EXPANSION | Mechanical | override | autoplan rule | — |
| 3 | CEO | E1 isolation tests for week + month | Mechanical | P2 | S effort, existing gap | — |
| 4 | CEO | E2 month class count | Mechanical | P2 | S, answers the planning question | — |
| 5 | CEO | E3 / E5 deferred | Mechanical | P3 | M effort, outside the core | build now |
| 6 | CEO | E4 print/share deferred | Taste | P3 | Needs an export design | build now |
| 7 | CEO | E6 useTeacherFilter hook | Mechanical | P4 | Same logic needed twice | copy into month view |
| 8 | CEO | Spec review rounds 1-3 fixes (18 items) | Mechanical | P1/P5 | Consistency and implementability | leave ambiguous |
| 9 | CEO | F1 per-day count badge | Mechanical | P1 | Goal promises overload visibility | reword goal only |
| 10 | CEO | F1 same-teacher overlap marker | Taste | P1 | Cheap conflict signal; may flag intentionally combined classes | skip marker |
| 11 | CEO | F2 students keep Month; default view stays Week | Taste | P5/P6 | No evidence either way; smallest change | default students to List |
| 12 | CEO | F3 shared sessionAppearance helper | Mechanical | P4 | Prevents week/month drift | two renderers |
| 13 | CEO | F6 week-start param deferred (E9) | Mechanical | P3 | YAGNI for the current market | param now |
| 14 | CEO | F7 two commits | Mechanical | P6 | Reviewable and revertible | one commit |
| 15 | CEO | Error Alert + Retry on month AND week views | Mechanical | P2 | Week view has the same gap | month only |

### Design — review (autoplan Phase 2)

**System audit.** No DESIGN.md (gap; recommend `/design-consultation` later). Tokens come from `src/app/globals.css` (`--warning`, `--success`, `--destructive`, `--primary`, `--muted`) and `week-calendar/group-colors.ts`. Barrel components available: `Alert`, `Badge`, `Tag`, `Button`, `EmptyState`, `Popover`, `Tooltip`, `Skeleton`, `Card`, `SegmentedControl`, `Select`, `Sheet`. UI mode: **OPERATE (app UI)**.

**Step 0.** Initial design completeness **5/10**: data, URLs and states are specified; the day cell, overflow interaction, responsive breakpoint, a11y and locale are left to the implementer. A 10 names the cell anatomy, every interaction target, the breakpoint, the semantics and the formatter inputs. Focus areas: all 7 (autoplan override P1).

**Step 0.5 mockups.** gstack designer is available (`DESIGN_READY`), but the comparison-board flow needs Mohamed to pick variants in a browser. Skipped in this autoplan run; the month grid reuses the week view's visual language (group swatches, status styling, existing tokens). TASTE decision surfaced at the gate; `/design-shotgun` can generate variants before implementation if wanted.

**Dual voices.**
- CLAUDE SUBAGENT (design — independent review): completed, `INPUT: design a9e0f29d…eb59` matches the snapshot. 13 findings (2 critical, 5 high, 6 medium).
- CODEX SAYS (design — UX challenge): **unavailable** (CLI not installed). `[subagent-only]`.

```
DESIGN OUTSIDE VOICES — LITMUS SCORECARD:
═══════════════════════════════════════════════════════════════
  Check                                    Claude  Codex  Consensus
  1. Brand unmistakable in first screen?   N/A(app) —     N/A
  2. One strong visual anchor?             NO→YES   —     N/A (month label as heading, finding 10)
  3. Scannable by headlines only?          YES      —     N/A
  4. Each section has one job?             YES      —     N/A
  5. Cards actually necessary?             YES(mobile day cards only) — N/A
  6. Motion improves hierarchy?            N/A (no motion)   —  N/A
  7. Premium without decorative shadows?   YES      —     N/A
  Hard rejections triggered:               none     —     N/A
═══════════════════════════════════════════════════════════════
Outside unavailable: consensus N/A, never CONFIRMED.
```

**Pass 1 Information architecture: 5 → 9.** Missing: what the eye lands on, toolbar order, cell anatomy. Fixed (auto, P5): month label is the view's heading with the in-month class count under it; toolbar row 2 holds navigation (leading) and teacher filter (trailing). Cell anatomy below. Remaining 1 point: no mockup.

```
┌ Month label (H3, e.g. "September 2026")          ┐
│ 42 classes this month (muted)                     │
├ [‹] [Today] [›]                 Teacher [All ▾]   ┤
├ inline notice (only when in-month count is 0)     ┤
├ Sat  Sun  Mon  Tue  Wed  Thu  Fri  (localized)    ┤
│ ┌─────────────┐                                   │
│ │ 17        ⚠ │ date number (leading) · overlap marker (trailing)
│ │ ● 16:00 A1  │ chip: group swatch, HH:mm, group name (truncate)
│ │ ● 18:30 B2  │
│ │ ● 20:00 C3  │
│ │ +2 more     │ opens day popover
│ └─────────────┘
└───────────────────────────────────────────────────┘
```

**Pass 2 Interaction states: 6 → 9.**
| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Month grid (first load) | grid-height `Skeleton` | inline notice above grid: "No classes this month." / with teacher filter: "No classes for {name} this month." + "Clear filter" button | `Alert` destructive + Retry | chips | days with >3 → "+N more" |
| Month grid (prev/next, filter change) | previous month stays, dimmed (`opacity-60`), chips disabled (`keepPreviousData`) | same | same | same | same |
| Live classes not configured | — | — | — | agenda's `sessions.notConfiguredNotice` `Alert` above grid | — |
| Day popover | — | n/a | — | `DaySessionsCard` + "Open in week view" link | — |
| Mobile list (<lg) | card skeletons | full `EmptyState` (same filter-aware text) | `Alert` + Retry | per-day cards | — |
Remaining 1 point: no designed illustration for empty (EmptyState icon only), acceptable for an operate surface.

**Pass 3 Journey: 6 → 8.**
| Step | User does | Feels | Plan specifies |
|---|---|---|---|
| 1 | Opens Live Classes, taps Month | orientation | month label + count first |
| 2 | Scans for heavy days | control | 3 chips + "+N more" per day, overlap ⚠ |
| 3 | Opens a busy day | curiosity | popover with the full day list, no page change |
| 4 | Fixes a clash | confidence | chip → edit dialog, or "Open in week view" to drag |
| 5 | Next month | planning ahead | prev/next keeps previous grid while loading |
5-second: the month shape reads at a glance; 5-minute: clash fixing without leaving the month; long-term: the view teams screenshot for WhatsApp (E4 deferred). Remaining: share/print deferred.

**Pass 4 AI slop: 7 → 8.** Classifier OPERATE. No hard rejections: layout is a calendar table, not stacked cards; mobile day cards are the interaction unit (card IS the list group, same as the agenda). Litmus above. Removed noise: two density signals per cell (per-day count badge + "+N more") → one (see taste decision T-D1). Remaining: no mockup evidence.

**Pass 5 Design system: 6 → 8.** No DESIGN.md. Plan now names tokens: overlap marker `AlertTriangleIcon` `size-3.5 text-warning`; overlapping chips `ring-1 ring-warning`; today `bg-primary text-primary-foreground` rounded date number; outside-month days `text-muted-foreground` + chips `opacity-60`; cancelled chips use the existing `sessionAppearance` line-through. Components: `Popover`, `Alert`, `EmptyState`, `Skeleton`, `Button` (`variant="ghost" size="sm"` for "+N more"). Remaining 2 points: no DESIGN.md.

**Pass 6 Responsive & a11y: 3 → 8.** Grid shows at `lg` and up; below `lg` the per-day list (768–1024px cells were ~90px, too narrow for Arabic group names). Semantics: `<table>` with `<th scope="col">` weekday headers; each day `<td>` has `aria-label` = full localized date; chips are `<button>` named "{group}, {time}, {status}{, adjusted}"; "+N more" named "{N} more classes on {date}" (`sessions.month.openDay`); overlap marker is a `<button>` opening a `Popover` that lists the clashing classes (works on touch). Tab order row by row; arrow-key grid navigation not in v1 (stated). Touch targets: chips `min-h-6` on desktop only (grid is desktop-only); mobile list uses existing `SessionList` targets. RTL: the table follows `dir`, so Saturday is the rightmost column in Arabic with no manual reversal; chevrons keep `rtl:rotate-180`. Remaining: no arrow-key navigation, no screen-reader test pass.

**Pass 7 Unresolved decisions.**
| Decision | Resolved how |
|---|---|
| Cancelled vs chip slots vs counts | Non-cancelled sessions fill the 3 slots first (start order), cancelled after; "+N more" counts every remaining session; counts elsewhere exclude cancelled |
| "+N more" target | Popover with that day's `DaySessionsCard`; date number → week view; empty cell click does nothing |
| Neighbour-month days | Chips shown at `opacity-60`, clickable, excluded from counts and overlap markers |
| Locale | Every formatter gets the i18n locale (`ar` → Arabic month names and Arabic-Indic digits via `Intl`), chip time `timeStyle: "short"` |
| "Today" | Computed in the academy zone; on mobile, Today scrolls to today's card or the next day with classes |
| Mobile gaps | Known limitation: the list hides empty days; stated in plan |
0 unresolved.

<!-- autoplan-accepted:design -->
- Month label is the view heading (`H3`, locale-aware `Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone })`) with the in-month class count as muted text under it; toolbar row 2: prev / Today / next on the leading side, teacher filter on the trailing side (full width below `sm`).
- Empty in-month state is an inline notice between toolbar and weekday headers (not an `EmptyState` below the grid): "No classes this month." or, with a teacher filter, "No classes for {name} this month." plus a "Clear filter" button. Below `lg` the full `EmptyState` with the same text is used. i18n keys `sessions.month.emptyMonth`, `sessions.month.emptyForTeacher`, `sessions.month.clearFilter` (en + ar).
- (Replaces CEO F1's per-day count badge) Each day cell shows at most 3 chips: non-cancelled sessions first in start order, then cancelled; "+N more" counts every remaining session of that day. There is no separate per-day count badge. The same-teacher overlap marker from CEO F1 stays.
- "+N more" opens a `Popover` showing that day's `DaySessionsCard` with an "Open in week view" link; the date number goes to the week view (spec review 3 rule); clicking empty cell space does nothing.
- The grid renders at `lg` and up; below `lg` the per-day list is shown instead (replaces the `md` breakpoint in scope item 4).
- Grid semantics: `<table>` with `<th scope="col">` localized weekday headers; each day cell labelled with the full localized date; chips are `<button>` elements named "{group}, {time}, {status}" plus "adjusted" when adjusted; "+N more" named via `sessions.month.openDay` ("{count} more classes on {date}"); tab order row by row; no arrow-key navigation in v1.
- Overlap marker: `AlertTriangleIcon` `size-3.5 text-warning` on the trailing side of the date row, rendered as a `<button>` with an accessible label naming the teacher, opening a `Popover` listing the clashing classes; the clashing chips get `ring-1 ring-warning`. On the mobile list the marker appears on the `DaySessionsCard` header.
- When `liveClassesEnabled` is false the month view shows the agenda's `sessions.notConfiguredNotice` `Alert` above the grid.
- All formatters (month label, weekday headers, day numbers, chip times with `timeStyle: "short"`) take the current i18n locale and the academy `timeZone`; "today" is computed in the academy zone; the table follows `dir` (Saturday is the rightmost column in Arabic).
- Loading: grid-height `Skeleton` on first load only; on month or teacher change the previous month stays visible at `opacity-60` with chips disabled until data arrives (`placeholderData: keepPreviousData`).
- Neighbour-month days: date number `text-muted-foreground`, chips at `opacity-60`, still clickable, excluded from counts and overlap markers.
- Mobile: "Today" scrolls to today's card or the next day with classes. Known limitation (documented in plan): the mobile list hides days without classes.
- Today's date number uses `bg-primary text-primary-foreground` in a small rounded badge.
- Implementation follows the UI gate in CLAUDE.md: `/ui-scan --plan` before writing UI, `/ui-scan` on every touched UI file after, fixing all critical/major before `typecheck && build`.
<!-- /autoplan-accepted:design -->

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | no DESIGN.md; app tokens in globals.css     |
  | Step 0               | 5/10, all 7 dimensions                      |
  | Pass 1  (Info Arch)  | 5/10 → 9/10 after fixes                     |
  | Pass 2  (States)     | 6/10 → 9/10 after fixes                     |
  | Pass 3  (Journey)    | 6/10 → 8/10 after fixes                     |
  | Pass 4  (AI Slop)    | 7/10 → 8/10 after fixes                     |
  | Pass 5  (Design Sys) | 6/10 → 8/10 after fixes                     |
  | Pass 6  (Responsive) | 3/10 → 8/10 after fixes                     |
  | Pass 7  (Decisions)  | 6 resolved, 0 deferred                      |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (3 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 2 items proposed                            |
  | Approved Mockups     | 0 generated (skipped, taste T-D2)           |
  | Decisions made       | 14 added to plan                            |
  | Decisions deferred   | 0                                           |
  | Overall design score | 3/10 → 8/10                                 |
  +====================================================================+
```

**NOT in scope (design).** Arrow-key grid navigation (v1 tab order only); showing empty days in the mobile list; a DESIGN.md for the app (recommend `/design-consultation`).

**What already exists (design).** Week view visual language (`session-block.tsx`, `group-colors.ts`), agenda day cards and not-configured `Alert`, `SessionEditDialog` read-only mode for students (`canEdit`), `EmptyState`, `Popover`, `SegmentedControl`.

**TODOS proposed (design).** D-T1 arrow-key navigation for calendar grids (P3); D-T2 create DESIGN.md via `/design-consultation` (P3).

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 16 | Design | Skip mockups in autoplan run | Taste (T-D2) | P6 | Board needs Mohamed's picks; grid reuses week-view language | generate 3 variants now |
| 17 | Design | Drop per-day count badge, keep "+N more" + overlap marker | Taste (T-D1, reverses CEO #9) | P5 | One density signal per cell | keep both signals |
| 18 | Design | Inline empty notice above grid, filter-aware | Mechanical | P5 | EmptyState below 6 rows is off-screen | EmptyState below grid |
| 19 | Design | Non-cancelled chips first | Mechanical | P1 | Counts and chips must agree | server order |
| 20 | Design | "+N more" opens popover | Mechanical | P1 | Keeps the month task in place | jump to week |
| 21 | Design | Grid at `lg`+, list below | Mechanical | P5 | 90px cells too narrow for Arabic names | compact chip at md |
| 22 | Design | Table semantics + named chips + focusable overlap marker | Mechanical | P1 | a11y was unspecified | aspirational a11y |
| 23 | Design | Not-configured banner, locale/zone formatters, keepPreviousData, neighbour-day rules, toolbar order, marker tokens, mobile Today scroll | Mechanical | P1/P5 | Structural gaps | leave to implementer |

### Phase 2.5 DX review

SKIPPED: no developer-facing scope (snapshot scope 1 match, threshold 2; not a developer tool, not agent-primary). Not a completed review.

### Eng — review (autoplan Phase 3)

**Step 0 scope challenge.** Read: `lib/week.ts`, `server/queries.ts#listWeekSessions`, `server/router.ts`, `server/schemas.ts`, `sessions-week-view.tsx`, `sessions-agenda.tsx`, `week-calendar/session-block.tsx`, `core/organizations/server/schemas.ts#listMembersInput`, `tests/sessions-week.test.ts`, `tests/integration/lib/harness.ts`, `package.json` scripts.

| Sub-problem | Existing code | Plan |
|---|---|---|
| Zone-safe date math | `lib/week.ts` | extend |
| Range query + visibility | `listWeekSessions`, `selectSessions`, `ownClassesOnlyForStudents` | extract `loadRangeSessions` |
| Teacher options | inline in week view, `members.list` page 1 of 100 | extract hook + fix (M1) |
| Status/adjusted styling | `session-block.tsx:81-84, 103` | `sessionAppearance` |
| Per-day list | `sessions-agenda.tsx#groupByDay`, `SessionList` | move to `lib/day-groups.ts` |
| Test harness | vitest `npm test`; integration `npm run test:isolation`; `createMember`/`destroyMember` | reuse |

Complexity gate: ~19 files (new: `sessions-month-view.tsx`, `month-calendar/month-calendar.tsx`, `day-sessions-card.tsx`, `session-appearance.ts`, `use-teacher-filter.ts`, `lib/view-anchor.ts`, `lib/day-groups.ts`, `tests/integration/sessions-visibility.test.ts`; edited: `lib/week.ts`, `queries.ts`, `schemas.ts`, `router.ts`, `live-classes-page.tsx`, `sessions-week-view.tsx`, `session-block.tsx`, `sessions-agenda.tsx`, `core/organizations/server/schemas.ts` + members query, `en.ts`, `ar.ts`, `tests/sessions-week.test.ts`, `org-isolation.test.ts`). Gate tripped (>8 files). Autoplan override "scope challenge: never reduce" → **Original arrangement kept** (auto-decided); every file maps to an accepted requirement and the two-commit split (CEO F7) bounds review size. Search check: no new infrastructure or concurrency pattern; month grid is a plain `<table>` [Layer 1]. TODOS cross-reference: nothing blocks this plan. Retrospective: no reverts in `live-classes/` history.

**Own findings (Step 0 + sections).**
- M1 [P2] (confidence 9/10) `sessions-week-view.tsx` — teacher options come from `members.list({ page: 1, perPage: 100 })` then `.filter(role !== "student")`; `listMembersInput` (`core/organizations/server/schemas.ts:79-84`) has no role filter, so an academy with >100 members silently loses teachers from the filter and the edit dialog. Accepted (P2, blast radius of E6).

**Dual voices.**
- CLAUDE SUBAGENT (eng — independent review): completed, `INPUT: eng 2982d697…b5f` matches the snapshot. 12 findings (0 critical, 2 high, 6 medium, 4 low).
- CODEX SAYS (eng — architecture challenge): **unavailable** (CLI not installed). `[subagent-only]`.

```
ENG DUAL VOICES — CONSENSUS TABLE:
  Dimension                           Claude  Codex  Consensus
  1. Architecture sound?               yes     —      N/A
  2. Test coverage sufficient?         gaps    —      N/A (#1, #2, #6 test cases added)
  3. Performance risks addressed?      mostly  —      N/A (composite index deferred, taste)
  4. Security threats covered?         yes     —      N/A
  5. Error paths handled?              gaps    —      N/A (#4 error over placeholder data)
  6. Deployment risk manageable?       yes     —      N/A
Missing voice = N/A, never CONFIRMED. Single-voice HIGH findings flagged: #1 Thursday rule, #2 4-row months (both verified by hand: week 2026-09-26 has 5 September days; Feb 2025 starts Saturday).
```

**Section 1 Architecture.**
```
                        ┌──────────────────────── live-classes-page.tsx ─────────────────────────┐
                        │ view switch ── viewAnchorParams (lib/view-anchor.ts) ── ?view ?week ?month│
                        └───────┬──────────────────────────┬───────────────────────────┬──────────┘
                     SessionsWeekView               SessionsMonthView            SessionsAgenda
                       │  useTeacherFilter ◄──────────── │  useTeacherFilter            │
                       │  WeekCalendar                    │  MonthCalendar (<table>, lg+)│
                       │   └ SessionBlock ─┐              │   ├ MonthChip ─┐             │
                       │                   ├─ sessionAppearance()          │             │
                       │                   └───────────────┘               │             │
                       │                                  │  DaySessionsCard (popover + <lg) ◄── DaySessionsCard
                       │                                  │   └ SessionList                  └ SessionList
                       │  SessionEditDialog ◄─────────────┘
  tRPC  sessions.week ─┐   sessions.month ─┐           organizations.members.list({ roles })
                       └──── loadRangeSessions(ctx, bounds, teacherId)
                                 ├ org zone lookup (NOT_FOUND)
                                 └ selectSessions + ownClassesOnlyForStudents
  lib/week.ts: monthStartOf · addIsoMonths · monthGridDates · monthBoundsInZone · parseMonthParam
               countInMonth · findTeacherOverlaps      lib/day-groups.ts: groupByDay
```
Realistic production failure: first load just after local midnight on the 1st picks the wrong month while the org zone is still loading (eng #3) → fixed by making `month` optional server-side (server defaults to today in the academy zone). Rollback: revert commit 2 (UI); commit 1 is inert without it.

**Section 2 Code quality.** Findings: M1 (members role filter); eng #5 `parseMonthParam` must check `parseIsoDate` before the round-trip because `addIsoDays` returns bad input unchanged (`lib/week.ts#addIsoDays`: `if (!parts) return date;`); eng #9 server returns `gridEnd`; eng #7 overlap computation as a per-teacher sort-and-sweep over the month (handles sessions crossing local midnight). No new method branches >5. Stale diagrams: none in touched files.

**Section 3 Test review.** Framework: vitest (`npm test`), integration vitest config (`npm run test:isolation`); no React component test setup in `tests/`, so UI is verified by `/ui-scan` + manual check.

```
CODE PATHS                                                   USER FLOWS
[+] lib/week.ts                                              [+] Month view
  ├── monthStartOf            [GAP→planned] mid, last day      ├── [GAP→manual] open Month, see grid + count
  ├── addIsoMonths            [GAP→planned] Dec→Jan, Jan 31+1  ├── [GAP→manual] prev/next keeps old month dimmed
  ├── monthGridDates          [GAP→planned] 4/5/6 rows,        ├── [GAP→manual] "+N more" popover → chip → dialog
  │                                        consecutive unique  ├── [GAP→manual] date number → week view
  ├── monthBoundsInZone       [GAP→planned] Cairo + Santiago   ├── [GAP→manual] teacher filter, empty notice, Clear
  ├── parseMonthParam         [GAP→planned] abc, 2026-13-01,   ├── [GAP→manual] error Alert + Retry (offline)
  │                                        2026-02-30, valid   └── [GAP→manual] <lg list, Today scrolls
  ├── countInMonth            [GAP→planned] cancelled, neighbour days
  └── findTeacherOverlaps     [GAP→planned] back-to-back, cancelled, null teacher, crosses midnight
[+] lib/view-anchor.ts        [GAP→planned] week→month 2026-08-29/today 09-02 → Sep;
                                             week 2026-09-26 → Sep; list untouched; no ?week → month deleted
[+] lib/day-groups.ts         [GAP→planned] 23:30 local lands on local day
[+] server listMonthSessions  [GAP→planned][→E2E integration] isolation (week+month), student visibility,
                                             no-trainee student, month omitted → today in zone
[+] members.list roles filter [GAP→planned][integration] roles ["admin","teacher"] excludes students
[+] week view regression      [★★ existing] tests/sessions-week.test.ts week math unchanged; manual drag/paint check

COVERAGE (planned): 12/12 pure paths unit-tested, 4 integration paths, 7 user flows manual
```
REGRESSION: `useTeacherFilter` and `sessionAppearance` extraction touch the week view (drag, paint mode, availability). Regression contract (auto-decided, P1): week view behavior unchanged; existing `tests/sessions-week.test.ts` stays green; manual check of drag, resize, paint-mode reset on teacher change, and status styling. Test plan artifact written to `~/.gstack/projects/Mohamed-Magdy-fayed-gateling-tms/moham-preview-eng-review-test-plan-*.md`.

**Section 4 Performance.** One range query per month (≤42 days) on single-column indexes, fine at current volume; composite `(organization_id, scheduled_at)` index deferred to TODOS (taste, eng #8). Overlap sweep O(n log n) client-side. `keepPreviousData` avoids refetch flashes. No N+1.

<!-- autoplan-accepted:eng -->
- M1: `listMembersInput` gains optional `roles: z.array(z.enum(organizationMembershipRoleValues)).optional()`, applied as a WHERE in the members query; `useTeacherFilter` requests `roles: ["admin", "teacher"]` so teachers are never lost past 100 members. Verify: integration test that `members.list({ roles: ["admin","teacher"] })` excludes a student member.
- (Replaces spec review 3's Thursday rule) Week → Month uses today's month when today falls in the viewed week, else the month of the week's 4th day, `addIsoDays(weekStart, 3)`. Unit tests: week 2026-09-26 (today outside) → September; week 2026-08-29 with today 2026-09-02 → September; week 2026-08-29 with today outside → September.
- (Replaces "5 or 6 rows") `monthGridDates` returns 4, 5 or 6 whole weeks; row count is `dates.length / 7`; the skeleton uses a fixed min-height, not a row count. Unit test: February 2025 → 4 rows; Saturday-starting 31-day month → 5 rows; 31-day month starting Friday → 6 rows.
- `month` is optional in `monthSessionsInput`; when omitted the server uses today in the academy zone. The client sends `month` only when `?month=` parses; the H3 label and class count come from the response's `monthStart`, not the URL. Verify: integration test that omitting `month` returns the current academy-zone month.
- While `isPlaceholderData` is true the header and grid are dimmed together; when `isError` is true the error `Alert` + Retry shows even if placeholder data is displayed.
- `parseMonthParam` requires `parseIsoDate(value) !== null` before the round-trip check; unit tests include `abc`, `2026-13-01`, `2026-02-30`, `2026-09-17`.
- DST tests add `America/Santiago` (midnight transition) alongside Cairo, asserting grid bounds equal `zonedInstant(edge, 0)` and that every `monthGridDates` entry is unique and consecutive.
- All day bucketing (in-month count, chips, overlaps, mobile filter) uses the academy zone via `zonedParts` / `groupByDay`; `findTeacherOverlaps` is a per-teacher sort-and-sweep over the whole month and marks every day an overlap touches (including sessions crossing local midnight). Unit test: a 23:30-local session buckets to its local day.
- The server response includes `gridEnd` (exclusive) alongside `gridStart` and `monthStart`.
- The overlap marker renders only for staff (`role !== "student"`).
- Clicking a chip inside the "+N more" popover closes the popover, then opens `SessionEditDialog`; focus returns to the "+N more" trigger when the dialog closes; students get the same read-only dialog as the week view.
- Week-view regression contract: behavior unchanged after `useTeacherFilter` and `sessionAppearance` extraction; `tests/sessions-week.test.ts` stays green; manual check of drag, resize, paint-mode reset on teacher change, availability overlay and status styling.
- Complexity gate: original file arrangement kept (autoplan never-reduce override).
- Deferred to TODOS.md: composite `(organization_id, scheduled_at)` index (eng #8, taste).
- Gates before push: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:isolation` (throwaway postgres:17 per local tooling notes), `npm run build` (with dummy env overrides), then commit and push to `preview`.
<!-- /autoplan-accepted:eng -->

**Failure modes registry (eng).**
```
CODEPATH             | FAILURE                               | TEST       | HANDLED             | USER SEES          | CRITICAL?
listMonthSessions    | org missing                           | no         | NOT_FOUND           | error Alert        | no
listMonthSessions    | month omitted near local midnight     | integration| server default      | correct month      | no
monthGridDates       | 4-row February                        | unit       | dates.length/7      | correct grid       | no
viewAnchorParams     | week straddling months                | unit       | 4th-day rule        | right month        | no
parseMonthParam      | junk param                            | unit       | fallback            | current month      | no
findTeacherOverlaps  | session crossing midnight             | unit       | sweep               | marker both days   | no
teacher filter       | >100 members                          | integration| roles filter        | all teachers       | no
month query error    | network/DB with placeholder data      | manual     | Alert + Retry       | error, not stale   | no
```
0 critical gaps.

**Worktree parallelization.** Lane A: commit 1 (lib + server + tests, `live-classes/sessions/lib`, `server`, `core/organizations/server`, `tests/`). Lane B depends on A: commit 2 (UI, `admin/`, i18n). Sequential implementation, no parallelization opportunity worth the merge cost.

**NOT in scope (eng).** Composite index (TODO); month drag-and-drop (TODO); component-level React tests (no runner configured; UI verified by /ui-scan + manual).

**What already exists (eng).** See Step 0 table; reuse is maximal. `keepPreviousData` pattern exists in `academies-section.tsx:76`.

**Implementation Tasks.**
- [ ] **T1 (P1, human: ~3h / CC: ~15min)** — lib — month helpers, `parseMonthParam`, `countInMonth`, `findTeacherOverlaps`, `view-anchor.ts`, `day-groups.ts` + unit tests
  - Files: `src/features/system/live-classes/sessions/lib/{week,view-anchor,day-groups}.ts`, `tests/sessions-week.test.ts`
  - Verify: `npm test`
- [ ] **T2 (P1, human: ~3h / CC: ~15min)** — server — `loadRangeSessions`, `sessions.month` (optional month), `members.list` roles filter
  - Files: `sessions/server/{queries,schemas,router,index}.ts`, `core/organizations/server/{schemas,queries}.ts`
  - Verify: `npm run typecheck`
- [ ] **T3 (P1, human: ~3h / CC: ~15min)** — tests — isolation cases (week+month), `sessions-visibility.test.ts`, members roles test
  - Files: `tests/integration/org-isolation.test.ts`, `tests/integration/sessions-visibility.test.ts`
  - Verify: `npm run test:isolation`
- [ ] **T4 (P1, human: ~1d / CC: ~45min)** — UI — `useTeacherFilter`, `sessionAppearance`, `DaySessionsCard`, `SessionsMonthView`, `MonthCalendar`, view switch, error/empty/loading states, popover
  - Files: `sessions/admin/**`, `sessions/admin/live-classes-page.tsx`
  - Verify: `/ui-scan` on touched files, manual check per test plan
- [ ] **T5 (P1, human: ~1h / CC: ~5min)** — i18n — en + ar keys incl. plurals
  - Files: `src/features/core/i18n/global/{en,ar}.ts`
  - Verify: typecheck (key parity)
- [ ] **T6 (P2, human: ~1h / CC: ~10min)** — week view — error Alert + Retry, regression check
  - Files: `sessions-week-view.tsx`
  - Verify: manual regression list

```
Completion summary (eng)
- Step 0: Scope Challenge — scope accepted as-is (complexity gate: original arrangement, autoplan override)
- Architecture Review: 3 issues found (eng #3, #9, #10)
- Code Quality Review: 4 issues found (M1, eng #5, #7, #11)
- Test Review: diagram produced, 5 gaps identified (eng #1, #2, #6, regression contract, no-trainee/omitted-month cases)
- Performance Review: 1 issue found (eng #8, deferred)
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 8 items written (7 from CEO/design, 1 from eng)
- Failure modes: 0 critical gaps flagged
- Unresolved decisions: 0 in this review
- Outside voice: codex unavailable (not installed); native Claude subagent completed
- Parallelization: 2 lanes, 0 parallel / 2 sequential
- Lake Score: N/A
```

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 24 | Eng | Keep original file arrangement at complexity gate | Mechanical | override | Autoplan never reduces scope; two-commit split bounds review | smaller arrangement |
| 25 | Eng | M1 roles filter on members.list | Mechanical | P2 | Real bug in moved code | keep page-1 filter |
| 26 | Eng | 4th-day rule replaces Thursday rule | Mechanical | P5 | Thursday is day 6 in Sat-first weeks | Thursday |
| 27 | Eng | 4-row months supported | Mechanical | P1 | Feb 2025 | assume ≥5 |
| 28 | Eng | Optional month, server default in zone | Mechanical | P5 | Removes UTC-fallback race and request chain | gate on org query |
| 29 | Eng | Label/count from response; error over placeholder | Mechanical | P1 | Header and grid must agree | URL label |
| 30 | Eng | parseMonthParam parse-first; Santiago DST test | Mechanical | P1 | Round-trip alone accepts junk; Cairo never hits bounds | Cairo only |
| 31 | Eng | Zone bucketing everywhere; sweep overlaps | Mechanical | P1 | Off-by-day and cross-midnight overlaps | per-day pairwise |
| 32 | Eng | gridEnd in response; marker staff-only; popover→dialog focus | Mechanical | P5 | Clarity | — |
| 33 | Eng | Composite index deferred | Taste (T-E1) | P3 | Not needed at one academy's volume | add migration now |

### Final approval gate

APPROVED as-is by Mohamed on 2026-09-25 (D1, option A). 6 taste decisions kept at their recommendations; premise "month view of existing sessions" confirmed.
