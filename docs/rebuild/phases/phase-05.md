# Phase 5 — Learning Flow

**Goal:** the operational heart: trainees, groups (classes) with schedules, enrollments with progress, placement tests, certificates — honoring the **instant-onboarding principle** (class + students + assignment with zero master data).
**Prerequisites:** Phase 4 gate. **Reference docs:** `00-product-spec.md` journey steps 5–10, `03-data-model.md`, `04-code-donors.md`.

## Steps

1. **Schema slice.** `enrollments` (trimmed status enum: `placementTest → waiting → ongoing → completed → cancelled/postponed`), `enrollment_levels`, `groups` (**courseId nullable**), `group_students`, `placement_tests`, `certificates`. **Resolve the SOURCE `tests`-table question**: SOURCE has both `learning-flow\tests-table.ts` and form-based assessments — merge into `forms` unless a concrete need appears; record decision. Generate + migrate.
2. **Trainees.** `features\system\learning-flow\trainees\`: students = users with `student` membership role, created **directly** by admin/teacher (name + optional phone/email — minimal required fields; no invitation needed; account activation optional/later). Data-table list; profile view (enrollments, groups, attendance, responses). **`assertCanAddStudent` (50 free) in the create mutation.** SOURCE reference: `learning-flow\trainees\` + `learning-flow-router.ts`.
3. **Groups (classes).** CRUD with weekly schedule (day/time slots — SOURCE `groups-table.ts` schedule shape; UI with react-day-picker where helpful). **Creatable with no course attached.** Assign/remove students (multi-select from trainees; creating a new student inline from the group screen must work — the "add students directly on the spot" promise). On create/schedule-change → fire `group/created` → Inngest generates sessions (adapt SOURCE `group-created.ts`; C `src\lib\slots.ts` as slot-math reference). Sessions land in `zoom_sessions` as unlinked/offline sessions until Phase 6 attaches Zoom.
4. **Enrollments.** Enroll student ↔ course (when courses exist): status flow above, level progress via `enrollment_levels`. Group membership works **without** enrollment (master-data-optional); enrollment adds curriculum tracking on top. Status transitions validated server-side.
5. **Placement tests.** Assign a placement-type form to a trainee → student takes it (simple public-token or logged-in page) → teacher reviews → resulting level recorded; feeds enrollment level. SOURCE `placement-tests-router.ts` reference.
6. **Progress view.** Per-trainee and per-group progress: enrollment statuses, level completion, assessment results, attendance summary placeholder (real data Phase 6).
7. **Certificates.** On completion: generate certificate record + rendered artifact (server-rendered HTML→PDF or image via Firebase-stored template — keep v1 simple: one clean default template, org name + student + course/group + date). Downloadable; listed per trainee. SOURCE `certificates-table.ts` reference.
8. **Dashboard.** Replace placeholder: counts (students/groups/courses vs limits), today's sessions, recent activity.
9. **Tests.** vitest: schedule→session generation (incl. edge cases: DST-less Egypt weeks, end-date bounds), status-transition rules, student-limit check. Extend org-isolation test to new tables.

## Verification gate

- [ ] **The zero-master-data journey (product-spec step 5), timed:** fresh org → create group with schedule → add 3 students inline → assign → sessions visible — no course/level/lecture ever created. This must be friction-free.
- [ ] Enrollment flow with a Phase-4 course: enroll → ongoing → complete → certificate downloads
- [ ] Placement test round-trip assigns a level
- [ ] 51st student blocked with friendly limit message
- [ ] EN/AR parity; org isolation; `check` + `build` + `test` + `audit:gate` green

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① schema + trainees, ② groups + session generation, ③ enrollments + placement, ④ progress + certificates + dashboard) — each merged by Mohamed. Then update blueprint `STATE.md` (tests-table decision recorded); next action → phase-06.
