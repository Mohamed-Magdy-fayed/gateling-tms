# Gateling-TMS

A gateway to manage your online teaching business — a free-to-start,
multi-tenant training management system.

This repo is a ground-up rebuild. The full plan (product spec, architecture,
dependency policy, data model, phase-by-phase steps) lives in
[`docs/rebuild/`](docs/rebuild/README.md); current progress is tracked in
[`docs/STATE.md`](docs/STATE.md).

## Docs

| Doc | What it covers |
|---|---|
| [`docs/STATE.md`](docs/STATE.md) | Where the product stands, and what's next |
| [`docs/deploy.md`](docs/deploy.md) | Environments, Vercel env vars, Neon, the deploy step, testimonial moderation, release checklist |
| [`docs/demo-readiness-checklist.md`](docs/demo-readiness-checklist.md) | Every landing claim mapped to a demo path; walked before a release |
| [`docs/seeding-and-demo-data.md`](docs/seeding-and-demo-data.md) | The three seed profiles |
| [`docs/integrations-onmeeting.md`](docs/integrations-onmeeting.md) | Live classes |
| [`docs/integrations-google.md`](docs/integrations-google.md) | Google sign-in and the Forms import |
| [`docs/integrations-gemini.md`](docs/integrations-gemini.md) | AI-assisted short-answer grading |
| [`docs/inngest-offload-policy.md`](docs/inngest-offload-policy.md) | What goes to a background job, and why |

## Dev setup

1. **Postgres:** `docker compose up -d` (Postgres 17, local dev database).
2. **Env:** copy `.env.example` to `.env` and fill in `DB_USER` / `DB_PASSWORD` /
   `DB_NAME` / `DATABASE_URL` to match your local Postgres.
3. **Install:** `npm install`
4. **Run:** `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / start |
| `npm run check` | Typecheck + lint (Biome) |
| `npm run format` | Format with Biome |
| `npm run audit:gate` | `npm audit`, fails on any vulnerability |
| `npm run scan:secrets` | Sweep tracked files for known secret shapes |
| `npm test` | Unit tests (vitest) — no database needed |
| `npm run test:isolation` | Org-isolation suite (vitest) — **needs local Postgres** |
| `npm run test:e2e` | End-to-end tests (Playwright) — needs local Postgres + the demo seed |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio against the local database |
| `npm run db:seed` | Seed dev data (see below) |
| `npm run db:seed:clear` | Wipe seeded data (never run against preview/prod) |

## Seeded accounts

`npm run db:seed` is additive-only and idempotent — safe to run repeatedly.
The `baseline` profile creates one organization ("Gateling-TMS Dev Academy",
short code `DEV1`) with four accounts, all sharing the same dev password:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@gateling-tms.dev` | `DevPass123!` |
| Teacher | `teacher@gateling-tms.dev` | `DevPass123!` |
| Student | `student1@gateling-tms.dev` | `DevPass123!` |
| Student | `student2@gateling-tms.dev` | `DevPass123!` |

Dev-only credentials — never reused for preview/production seed data.

**Already had a database seeded before this table existed?** `db:seed` never
updates an existing row (additive-only by design), so a stale admin
credential row from before won't pick up the real password on its own. Run
`npm run db:seed:clear` (wipes seeded data — never run this against
preview/prod) followed by `npm run db:seed` once to pick up the real
credentials.
