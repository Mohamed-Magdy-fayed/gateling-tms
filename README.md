# Gateling-TMS

A gateway to manage your online teaching business — a free-to-start,
multi-tenant training management system.

This repo is a ground-up rebuild. The full plan (product spec, architecture,
dependency policy, data model, phase-by-phase steps) lives in
[`docs/rebuild/`](docs/rebuild/README.md); current progress is tracked in
[`docs/STATE.md`](docs/STATE.md).

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
| `npm test` | Unit tests (vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
