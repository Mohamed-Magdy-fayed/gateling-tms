# 04 — Code Donor Map

Where every subsystem comes from. Modes: **copy** (take verbatim, minimal path fixes), **adapt** (copy then apply listed changes), **inspire** (re-implement using the reference as the pattern). All donor paths verified to exist on 2026-07-19.

Donor roots:
- **B** = `G:\apps\gateling.com\`
- **A** = `G:\apps\atelier-management-system\`
- **C** = `G:\apps\gateling-software-team\`
- **S** = `C:\Users\moham\OneDrive\Desktop\gateling-tms\` (SOURCE)

## Core platform

| Subsystem | From | To (TARGET src\) | Mode | Changes |
|---|---|---|---|---|
| Data table (24 files) | B `src\features\core\data-table\` (components\, hooks\use-data-table.ts, hooks\use-table-url-state.ts, lib\filter-values.ts, lib\csv.ts, lib\select-column.tsx, lib\entity-actions-column.tsx, lib\pinning.ts, lib\entity-column-pinning.ts, types.ts, index.ts) | `features\core\data-table\` | **copy** | Re-point imports; keep i18n keys (engine is also B's). `components\entity-page-header.tsx` + `entity-audit-info-dialog.tsx` come along. |
| Forms system | B `src\components\forms\` — hooks.tsx (useAppForm), form-base.tsx, overlay-form.tsx, all `*-field.tsx` (string, number, email, password, date, date-time, boolean, select, textarea, image, mobile, combobox-one, search-lookup), validation-messages.ts, index.ts | `components\forms\` | **copy** | Skip `gallery-manager.tsx` unless Phase 4 needs galleries. image-field depends on Firebase storage helper — copy together. |
| i18n engine | B `src\features\core\i18n\` — lib.ts (has `dt` export line 57), client.tsx, server.ts, global\{en,ar,index}.ts | `features\core\i18n\` | **copy** | Empty the global dictionaries to TMS strings; keep engine untouched. |
| tRPC | B `src\integrations\trpc\` — init.ts, query-client.ts, db-error.ts, routers\_app.ts | `integrations\trpc\` | **adapt** | Keep procedures; **add `orgProcedure`** middleware (session → membership check → inject `ctx.organizationId`). Fresh `_app.ts` router list. HTTP route: B's `src\app\api\trpc\` handler. |
| Drizzle setup | B `src\drizzle\` — client, schemas\helpers.ts, seed harness (seed\cli.ts, seed\index.ts, seed\base.ts, seed\clear-db.ts, seed\profiles\{baseline,demo,performance}.ts), `drizzle.config.ts` (repo root) | `drizzle\` + root config | **adapt** | New schema per `03-data-model.md`; seed profiles rewritten for TMS entities; keep CLI/profile mechanism. |
| Inngest | B `src\integrations\inngest\client.ts` + functions\index.ts + function shape (e.g. on-user-registered.ts, booking-helpers.ts) + route `src\app\api\inngest\` | `integrations\inngest\` | **adapt** | App id `gateling-tms`. Function bodies are TMS domain (see below); B files are the wiring/idiom reference. Also adopt B `docs\inngest-offload-policy.md` as a rule. |
| Firebase storage | B `src\integrations\firebase\{admin,storage}.ts` + root `firebase-storage-cors.json` | `integrations\firebase\` | **adapt** | Path convention `orgs/{organizationId}/...`; add per-org byte accounting hook for the 1 GB cap (AD-6). |
| Redis / ratelimit | B `src\integrations\redis.ts` | `integrations\redis.ts` | **copy** | |
| Email | B `src\integrations\email.ts` + B auth email templates | `integrations\email.ts` | **adapt** | nodemailer **^9.0.3** (C `package.json` proves the version works; C `src\server\email.ts` is a second reference). SMTP env vars. |
| Auth | B `src\features\core\auth\` — core\{session,passwordHasher,token,permissions,helpers,index}.ts, core\oauth\{base,google}.ts, nextjs actions/components/emails, passkey-manager | `features\core\auth\` | **adapt** | branch→organization renames; cookie/env names for gateling-tms; Google OAuth only; keep passkeys. Middleware: B `src\proxy.ts` → `src\proxy.ts`. OAuth HTTP route from B's `src\app\api\` oauth handler. |
| Org management + switcher | B branch UI: `src\features\system\branches\` + branch-provider / use-active-branch pattern inside B auth feature | `features\core\organizations\` | **adapt** | Rename throughout; add plan/limits fields + limit-check helpers (AD-6). |
| Entity CRUD pattern | A `src\features\system\branches\admin\` — branches-table-page.tsx, components\{branch-form-dialog,branches-table-columns,branch-row-actions,branch-delete-dialog,branch-info-modal}.tsx | every `features\system\*` module | **inspire** | The canonical shape for every TMS entity (courses, trainees, groups…): table page + columns + form dialog + row actions + delete dialog + tRPC router. |
| Tooling configs | B `biome.json`, B `playwright.config.ts` + `e2e\`; C `vitest.config.ts` + `tests\`; B `docker-compose.yml`; B `components.json` (shadcn) | repo root | **adapt** | Project names/ports. |
| Docs discipline | C `docs\STATE.md`, C `docs\decisions\` ADR pattern; B `docs\demo-readiness-checklist.md`, B `docs\entity-blueprint.md` | TARGET `docs\` | **inspire** | TARGET keeps its own STATE.md + ADRs from day one (this blueprint's STATE.md migrates its decision log there at Phase 0). |

## Domain (from SOURCE — always adapt, never copy blindly: fix tenancy, branding, i18n keys)

| Subsystem | From (S) | To | Mode | Changes |
|---|---|---|---|---|
| Landing pages | `src\app\(landing-pages)\` — page sections `_components\{hero,value-proposition,features-preview,process,final-cta}-section*`, `features\`, `pricing\{page.tsx,data.ts}`, `about\ contact\ privacy\ terms\ refund\ cookies\`, `_layout\`, `_shared\` | `app\(landing)\` + `features\` translations | **adapt** | Rewrite copy per `00-product-spec.md`: truthful free tier, "powered by Zoom", paid = coming soon, Gateling-TMS branding, drop fake trust stats ("50+ academies"). Keep `pricing\data.ts` PLAN_CONFIGS values. Translations re-keyed to B i18n engine (same `dt` API — mostly mechanical). |
| Get-started wizard | `src\app\(landing-pages)\get-started\` (get-started-form.tsx, schema.ts, translations) + `src\server\api\routers\landing-routers\get-started-router.ts` | `app\(landing)\get-started\` + org onboarding action | **adapt** | Step 2 (feature multi-select) removed or reduced to "interests" analytics; submit → create user + organization (free plan) + membership + verification email (Inngest). |
| Content Library | `src\app\(system-pages)\content-library\` (courses-client/columns/form, `[id]\_components\{levels,lectures}`) + routers `src\server\api\routers\content-router\{courses,levels,lectures}-router.ts` | `features\system\content-library\` | **inspire** | Rebuild on A's entity pattern + B's table/forms; org-scope everything; lecture content without next-mdx-remote. |
| Form builder + responses | `[id]\_components\forms\{form-builder-form,forms-sheet}.tsx` + `content-router\forms-router.ts` | `features\system\assessments\` | **adapt** | Port builder logic onto TanStack Form + new schema; keep type enum (assignment/quiz/final/placement). |
| Google Forms import | `[id]\_components\forms\form-importer.tsx` + `src\server\services\google\{actions,types}.ts` + `system-routers\google-integrations-router.ts` + `google_integrations` table | `features\system\assessments\google-import\` | **adapt** | googleapis ^155; per-org integration; import as any assessment type incl. placement tests. |
| Learning Flow | `src\app\(system-pages)\learning-flow\{trainees,trainees-lists,groups,placement-tests,certificates}` + routers `learning-flow\{learning-flow,enrollments,groups,placement-tests}-router.ts` + lib.ts | `features\system\learning-flow\` | **inspire** | Rebuild per phase-05; group creation must not require a course. |
| Group → sessions generation | `src\server\services\inngest\functions\group-created.ts` | `integrations\inngest\functions\generate-group-sessions.ts` | **adapt** | Schedule expansion logic is the valuable part; C `src\lib\slots.ts` is a second reference for slot math. |
| Zoom | `src\lib\zoom\{onmeeting,meeting-helpers,types}.ts`, `src\server\api\routers\learning-flow\zoom-clients-router.ts`, `src\app\api\webhooks\zoom\route.ts`, inngest `functions\zoom-clients.ts` | `features\system\live-classes\` + `app\api\webhooks\zoom\` | **adapt** | Org-scoped clients; sessions linked to groups; attendance into `session_students`. |
| Other Inngest domain functions | S `src\server\services\inngest\functions\{email,create-lecture,delete-course,delete-level,users}.ts` | `integrations\inngest\functions\` | **inspire** | Same events, new schema; B function style. |
| Permissions | `src\lib\permissions\` + `src\auth\config\permissions.ts` | `features\core\auth\permissions` | **inspire** | Collapse to v1 roles (admin/teacher/student on membership); B `core\permissions.ts` is the primary base. |

## Explicitly NOT carried over from SOURCE

- `@auth/*` deps, next-mdx-remote, @mdxeditor (banned — `02-dependencies.md`); react-hook-form (replaced by TanStack Form); Resend (D6).
- SOURCE data table `src\lib\data-table\` (replaced by B's).
- SOURCE i18n engine `src\lib\i18n\` (B engine has `dt` already). SOURCE `_translations` **content** is still mined for AR/EN strings.
- 10-min JWT session code (`src\auth\core\session.ts`), GitHub/Microsoft OAuth, FCM push, Upstash-backed contact `messages` flow (Phase 3 decides), HR module UI (`src\app\(system-pages)\hr\`) — paid, roadmap.
- "HBS" branding and Inngest app id `hbs-tms`.
