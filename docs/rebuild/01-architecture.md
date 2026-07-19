# 01 — Architecture

Target stack, folder layout, and the key decisions with their rationale. All decisions confirmed with Mohamed (2026-07-19 Q&A) — see STATE.md decisions log D1–D11.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19.2 | Latest 16 stable (DONOR-B is on ^16.2.9) |
| Language | TypeScript strict, no `any` | |
| Styling | Tailwind CSS 4 + shadcn/ui | RTL-safe logical properties only |
| API | tRPC 11 | init/context copied from DONOR-B |
| ORM | Drizzle ≥0.45.2 + PostgreSQL (postgres.js driver) | 0.45.2 fixes GHSA-gpj5-g38j-94v9 |
| Auth | Custom: Redis sessions + Google OAuth + WebAuthn passkeys | from DONOR-B; **no next-auth** |
| Sessions | Upstash Redis, 7-day expiry, httpOnly cookie | replaces SOURCE's 10-min JWT |
| Forms | TanStack Form via `useAppForm` + Zod 4 | from DONOR-B |
| Tables | DONOR-B data-table (server-side pagination, URL state) | |
| Jobs | Inngest 4 | app id `gateling-tms` |
| Storage | Firebase Storage (admin SDK server-side) | 1 GB/org quota tracking |
| Email | nodemailer ≥9.0.3 over SMTP | Resend dropped (D6) |
| i18n | DONOR-B engine (`dt()` typed helper included) | EN + AR dictionaries |
| Lint/format | Biome 2.x | matches donor formatting |
| Tests | vitest (unit) + Playwright (e2e) | patterns from DONOR-C |

## Folder layout (TARGET `G:\apps\gateling-tms\src\`)

Mirrors DONOR-B so copied code lands with minimal path edits:

```
src\
├── app\                       # routes only — thin pages delegating to features
│   ├── (landing)\             # public marketing pages
│   ├── (system)\              # authed app (sidebar layout)
│   ├── auth\                  # sign-in/up, verify, oauth callback pages
│   └── api\                   # trpc, inngest, oauth, webhooks\zoom
├── features\
│   ├── core\
│   │   ├── auth\              # from DONOR-B features\core\auth
│   │   ├── data-table\        # from DONOR-B features\core\data-table (verbatim)
│   │   ├── i18n\              # from DONOR-B features\core\i18n
│   │   └── organizations\     # tenancy: org CRUD, switcher, memberships, limits
│   └── system\
│       ├── content-library\   # courses, levels, lectures (+ their forms)
│       ├── assessments\       # form builder, responses, google-forms import
│       ├── learning-flow\     # trainees, enrollments, groups, placement, certificates
│       ├── live-classes\      # zoom clients, sessions, attendance
│       └── dashboard\
├── components\
│   ├── forms\                 # from DONOR-B components\forms (useAppForm + fields)
│   └── ui\                    # shadcn primitives
├── integrations\
│   ├── trpc\                  # init.ts, routers\_app.ts, client, query-client
│   ├── inngest\               # client.ts, functions\
│   ├── firebase\              # admin.ts, storage.ts
│   ├── redis.ts
│   └── email.ts               # nodemailer transport + send helpers
├── drizzle\                   # schema.ts barrel, schemas\<domain>\, migrations\, seed\
├── data\env\                  # t3-env server.ts / client.ts
└── proxy.ts                   # Next 16 middleware (session + permission gating)
```

Feature modules own their UI components, translations (`translations\<name>-en.ts` / `-ar.ts`), schemas, and are consumed by thin `app\` routes — same convention as DONOR-B (`G:\apps\gateling.com\src\features\system\branches\` is the reference shape).

## Key decisions (ADR-style)

### AD-1 Multi-tenancy: shared schema, row-level, org column everywhere
Market-standard pattern for SaaS at this scale (one Postgres, one schema):
- `organizations` (tenant) + `organization_memberships` (user↔org many-to-many, `role` on the membership).
- **Every tenant-owned table carries `organizationId`** (FK, cascade, indexed). No transitive-only scoping — SOURCE's model (only `courses` and `zoom_clients` had the column) made cross-entity queries and limit enforcement fragile, and is explicitly rejected.
- Active org lives in the session; `orgProcedure` (tRPC middleware) injects `ctx.organizationId` and every query filters by it. UI gets an org-switcher for users in multiple orgs.
- Implementation: adapt DONOR-B's proven branches model — `G:\apps\gateling.com\src\drizzle\schemas\auth\branches-table.ts` + `branch-memberships-table.ts` and its branch-switcher/provider UI — renamed branch→organization.
- Postgres RLS noted as later defense-in-depth; not required for v1.

### AD-2 Auth: custom, Redis sessions, Google-only OAuth, passkeys
From DONOR-B `src\features\core\auth\`: `core\session.ts` (Redis-backed, `session-id` cookie, 7-day), `core\passwordHasher.ts`, `core\oauth\{base,google}.ts`, `core\token.ts` (email verify/reset), passkeys via @simplewebauthn 13. Guarding in `src\proxy.ts` + server-component checks (no client-only gates). GitHub/Microsoft OAuth from SOURCE explicitly out of v1. `@auth/*` packages banned (dead weight in SOURCE with an unfixable vulnerable chain).

### AD-3 i18n: DONOR-B engine
`G:\apps\gateling.com\src\features\core\i18n\lib.ts` already exports `defineTranslation` aliased as **`dt`** (line 57) — the typed-params helper Mohamed wants. Copied components' keys work unchanged. Global dictionaries + per-feature dictionaries; RTL via locale direction.

### AD-4 Data table: DONOR-B verbatim
`G:\apps\gateling.com\src\features\core\data-table\` copied as a unit (components, hooks, lib — 24 files). Server-side pagination/filtering through `use-table-url-state.ts` + `lib\filter-values.ts`; CSV export/import in `lib\csv.ts`. Every admin list in the app uses it — no ad-hoc tables.

### AD-5 Inngest: offload policy
App id `gateling-tms`. Adopt DONOR-B's `G:\apps\gateling.com\docs\inngest-offload-policy.md` as a rule: anything not needed for the immediate response is an event → function. V1 functions (domain events re-implemented from SOURCE's set): org lifecycle, verification/welcome emails, group→session generation, media processing, cascade deletes, Zoom client authorization, quota recalculation.

### AD-6 Plan limits enforced at the write path
`organizations` stores plan + usage counters (`studentCount`, `courseCount`, `storageBytes`). Creation mutations check the limit inside the same transaction; storage tracked on upload/delete via Firebase helper. Friendly limit UI, never silent failure. Counters recalculated by an Inngest reconciliation function (drift-proof).

### AD-7 Migration discipline
Generated migrations only, from Phase 1 onward — committed with `meta/` snapshots. SOURCE's single-squashed-migration/db:push history is one of the failures being corrected.

### AD-8 Testing
vitest for pure logic (limits, schedule→session generation, import parsing); Playwright for the `00-product-spec.md` journey (EN + AR/RTL smoke). Setup conventions from DONOR-C (`vitest.config.ts`, `playwright.config.ts`, `e2e\`).
