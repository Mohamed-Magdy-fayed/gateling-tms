# Phase 4 — Content Library

**Goal:** courses → levels → lectures with media uploads, plus the assessment form builder (assignment / quiz / final / placement) — all org-scoped.
**Prerequisites:** Phase 2 gate (Phase 3 can proceed in parallel after 2). **Reference docs:** `03-data-model.md`, `04-code-donors.md`.

Pattern for every entity: DONOR-A `G:\apps\atelier-management-system\src\features\system\branches\admin\` (table page + columns + form dialog + row actions + delete dialog + tRPC router), built on the Phase-1 data table + forms.

## Steps

1. **Schema slice.** Add per `03-data-model.md`: `courses`, `levels`, `lectures`, `forms`, `form_sections`, `questions`, `answers`, `form_responses` (+ review whether `form_analytics` earns a table — record decision), `google_integrations` (table now, logic Phase 7). All with `organizationId`. Generate + migrate. Remove/repurpose Phase-1 demo entity.
2. **Courses.** `features\system\content-library\courses\`: data-table list (search/filter/sort), create/edit via overlay-form, soft delete with cascade warning (delete → Inngest cascade like SOURCE `delete-course.ts`). Router on `orgProcedure`; **`assertCanAddCourse` (5 free) enforced in the create mutation from day one**. SOURCE reference: `src\app\(system-pages)\content-library\_components\` + `content-router\courses-router.ts`.
3. **Course detail — levels & lectures.** Course page with tabs (SOURCE `content-library\[id]\` shape): levels CRUD (ordered), lectures CRUD within level (ordered). Lecture content: title, description, rich text body (plain structured text/markdown-lite rendered safely — **no next-mdx-remote**), attachments.
4. **Media uploads.** Wire the B image-field + Firebase storage helper: lecture attachments + course thumbnail upload to `orgs/{orgId}/courses/...`. Every upload/delete updates `organizations.storageBytes`; `assertStorageBudget` (1 GB free) blocks over-budget uploads with a friendly message. Uploads >few MB or with processing go through Inngest (offload policy).
5. **Form builder.** `features\system\assessments\`: forms list (typed assignment/quiz/final/placement, status draft/published/archived) attachable to course/level/lecture; builder UI — sections → questions → answers, ordering (dnd-kit only if needed), per SOURCE `form-builder-form.tsx` + `forms-sheet.tsx` logic rebuilt on TanStack Form. Router from SOURCE `forms-router.ts` reshaped to `orgProcedure`.
6. **Responses (minimal now).** Store + list `form_responses` per form with basic scoring for quiz-type. Full student-facing flow matures in Phase 5; here: preview + response listing works.
7. **i18n + tests.** Both dictionaries for everything. vitest: storage accounting, course-limit check, builder schema validation.

## Verification gate

- [ ] E2E by hand: create course → 2 levels → 3 lectures (one with an uploaded attachment + thumbnail) → build a quiz with 2 sections/4 questions → publish → submit a response → see it listed
- [ ] Data table on courses list: server pagination/filter/sort + CSV export work
- [ ] 6th course blocked with friendly limit message (seed 5); oversized upload blocked by storage budget
- [ ] Org isolation test: org B cannot read/write org A course (automated)
- [ ] EN/AR parity; `check` + `build` + `test` + `audit:gate` green

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① schema + courses, ② levels + lectures + uploads, ③ form builder + responses) — each merged by Mohamed. Then update blueprint `STATE.md` (incl. form_analytics decision); next action → phase-05.
