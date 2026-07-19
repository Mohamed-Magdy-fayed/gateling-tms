# Phase 7 — Excel & Google Forms Import

**Goal:** the Excel-first promise: template download → fill → import for the big lists, and Google Forms imported as assessments (assignment/quiz/final/placement). This is the migration path for academies living in spreadsheets and Google Forms.
**Prerequisites:** Phase 5 gate (entities exist); Google-import benefits from Phase 4 forms. **Reference docs:** `00-product-spec.md` principles #2, `04-code-donors.md`.

## Steps

1. **Import framework.** Build one reusable import pipeline in `features\core\import\` used by all entities:
   - **Template download:** per-entity XLSX (exceljs) + CSV with localized headers, example row, and a hidden/second sheet documenting valid values (enums, date formats).
   - **Upload → parse → validate:** file → parsed rows → per-row Zod validation → **review screen** (valid/invalid rows, inline error messages, fix-or-skip) → confirm → batch insert via Inngest for large files (progress surfaced), synchronous for small ones.
   - Donor references: B `src\features\core\data-table\lib\csv.ts` + `components\data-table-export-import.tsx` (wire-format + UI hook-in), A's import-review feature + `scripts\migrations\migrate-legacy.ts` (review-before-commit pattern).
2. **Entity imports.** Wire the framework to: **students/trainees** (the critical one — name, phone, email, optional group name auto-matching/creating groups), **courses** (+levels as columns or second sheet), **enrollments** (student ↔ course ↔ status), **group assignments**. Limit checks (`assertCanAddStudent` etc.) run against the batch **before** commit — a file that would blow the free limit reports it upfront, offering partial import up to the cap.
3. **Exports.** Ensure every data table's CSV export (already from B) works on the same lists; add XLSX export where CSV loses fidelity. Round-trip guarantee: export → edit → re-import updates by id where present.
4. **Google integration (org-level).** `features\system\assessments\google-import\`: per-org Google OAuth grant (scopes: Forms read, Drive read for listing) stored in `google_integrations` (table from Phase 4). SOURCE donors: `src\server\services\google\{actions,types}.ts`, `system-routers\google-integrations-router.ts`. Uses the same Google Cloud project as sign-in OAuth; document scope additions in TARGET `docs\integrations-google.md`.
5. **Google Forms import.** From SOURCE `form-importer.tsx` + googleapis ^155: list the user's Forms → pick one → preview mapped structure (sections/questions/answer options → `forms/form_sections/questions/answers`) → choose target type (**assignment / quiz / final / placement**) and optional course/level/lecture attachment → import as draft → open in the Phase-4 builder for touch-ups → publish. Unsupported Google question types are flagged in preview (imported as closest match or skipped, listed clearly), not silently dropped.
6. **Landing truth check.** If landing copy anywhere mentions import capabilities, align wording with what shipped (template import for students/courses/enrollments; Google Forms as all four assessment types).
7. **Tests.** vitest heavy here: template parsers (good file, bad headers, mixed-validity rows, huge file path), limit-aware batch check, Google Forms structure mapper (fixture form JSON → schema). e2e: student import happy path via UI with a fixture file.

## Verification gate

- [ ] Round-trip: download students template → fill 10 rows (2 intentionally invalid) → upload → review shows 8 valid + 2 explained errors → import → 8 trainees exist, correctly grouped
- [ ] Import a real Google Form → quiz appears with correct sections/questions/answers → publish → a student response records
- [ ] Same Google Form importable as placement test and attachable per Phase-5 flow
- [ ] Batch that exceeds the 50-student cap reports before commit
- [ ] EN/AR parity (localized templates + review screen); `check` + `build` + `test` + `audit:gate` green

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① import framework + students import, ② remaining entity imports + exports, ③ Google integration + Forms import) — each merged by Mohamed. Then update blueprint `STATE.md`; next action → phase-08.
