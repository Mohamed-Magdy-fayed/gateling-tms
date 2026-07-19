# Phase 1 — Core Platform

**Goal:** the shared machinery — i18n, drizzle, tRPC, forms, data table, Inngest, Firebase — copied from DONOR-B and proven working with a demo entity.
**Prerequisites:** Phase 0 gate. **Reference docs:** `01-architecture.md`, `02-dependencies.md`, `04-code-donors.md` (modes/changes per subsystem).

Donor root for this whole phase: **`G:\apps\gateling.com`** (B).

## Steps

1. **i18n.** Copy B `src\features\core\i18n\` → `src\features\core\i18n\` (lib.ts, client.tsx, server.ts, global\). Reset `global\en.ts` / `ar.ts` to a minimal TMS common set (appName "Gateling-TMS", nav, actions, errors). Wire the provider + locale cookie + `dir` switching into root layout. Verify `dt()` typed params work in both locales.
2. **Drizzle.** Install per `02-dependencies.md`. Copy B's `drizzle.config.ts`, `src\drizzle\` client + `schemas\helpers.ts`. Create the **auth/org schema slice** from `03-data-model.md` (users, user_credentials, user_oauth_accounts, biometric_credentials, user_tokens, organizations, organization_memberships) — tables only, auth logic is Phase 2. First generated migration: `db:generate` → `db:migrate` (commit SQL + meta + journal). Scripts: `db:generate|migrate|studio|seed`.
3. **Seed harness.** Copy B `src\drizzle\seed\{cli,index,base,clear-db}.ts` + `profiles\` mechanism; baseline profile creates one dev org + admin user (finalized in Phase 2 when hashing exists — stub now).
4. **tRPC.** Copy B `src\integrations\trpc\{init,query-client,db-error}.ts` + client provider + `src\app\api\trpc\` route. Fresh `routers\_app.ts` with a `health` router. Context: db + session (session null until Phase 2) + locale. Define `publicProcedure`, `protectedProcedure`, and a stub `orgProcedure` (throws until Phase 2 wires membership).
5. **Forms.** Copy B `src\components\forms\` (all files listed in `04-code-donors.md`; skip gallery-manager). Fix imports; ensure validation-messages uses i18n keys present in both dictionaries.
6. **Data table.** Copy B `src\features\core\data-table\` **verbatim** (all 24 files incl. `hooks\use-table-url-state.ts`, `lib\filter-values.ts`, `lib\csv.ts`). Install `nuqs`, `@tanstack/react-table`. Add the translation keys it needs to both dictionaries.
7. **Inngest.** Copy B `src\integrations\inngest\client.ts` (app id → `gateling-tms`) + `functions\index.ts` + `src\app\api\inngest\` route + one `example.ts`. Script `"inngest": "npx inngest-cli@latest dev"`. Adopt B `docs\inngest-offload-policy.md` → TARGET `docs\inngest-offload-policy.md` (copy, adjust names).
8. **Firebase + Redis.** Copy B `src\integrations\firebase\{admin,storage}.ts` + root `firebase-storage-cors.json`; storage paths `orgs/{organizationId}/...`. Copy B `src\integrations\redis.ts`. Env vars appended to t3-env (Firebase service account, Upstash). These stay dormant until Phases 2/4 — must compile, not run.
9. **Proxy skeleton.** Copy B `src\proxy.ts` shape; for now only locale handling + pass-through (auth gating lands Phase 2).
10. **Prove it — demo entity.** Temporary `demo_items` table (org-less), CRUD router using the table-query pattern, one page under `(system)` rendering the data table with server-side pagination/sorting/filtering + URL state, and one `useAppForm` dialog (A's `src\features\system\branches\admin\` is the shape reference). This is the acceptance test for the whole phase. Delete the demo (table, migration via a new drop migration, page) at the start of Phase 4 or repurpose into courses.

## Verification gate

- [ ] Demo page: server-side pagination, sort, text filter, URL-state round-trip (reload keeps state), CSV export — all working
- [ ] Demo form dialog validates (Zod) with i18n error messages in EN and AR (RTL renders correctly)
- [ ] `inngest-cli dev` discovers the example function; a test event triggers it
- [ ] Migrations: `db:migrate` from scratch on a fresh DB succeeds (docker down/up)
- [ ] `npm run check` + `build` + `audit:gate` (0 vulns) green

## Close out

Deliver as segment PRs per `06-workflow.md` (suggested split: ① i18n + drizzle + seed, ② tRPC + forms, ③ data table + demo entity, ④ Inngest + Firebase + Redis + proxy) — each CodeRabbit-clean and merged by Mohamed. Then update blueprint `STATE.md` (phase ☑, decisions, next action → phase-02).
