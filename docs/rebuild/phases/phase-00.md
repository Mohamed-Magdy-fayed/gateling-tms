# Phase 0 — Init & Tooling

**Goal:** a clean, audit-clean Next.js 16 repo at `G:\apps\gateling-tms` with tooling, Postgres, env validation, and CI-style check scripts — ready to receive the core platform.
**Prerequisites:** none. **Reference docs:** `01-architecture.md`, `02-dependencies.md`.

## Steps

1. **Create the app.** `npx create-next-app@latest gateling-tms` in `G:\apps\` — TypeScript, App Router, Tailwind, src dir, no ESLint (Biome replaces it). Package name `gateling-tms`. `git init` + first commit.
   **GitHub:** `gh repo create` (private, Mohamed's account), push master. This bootstrap phase is the only work allowed directly on master; from Phase 1 on, everything follows the PR workflow (`06-workflow.md`).
   **CodeRabbit:** add a `.coderabbit.yaml` (sensible defaults: review all PRs, path filters excluding lockfile/migrations-meta) and **ask Mohamed to install/authorize the CodeRabbit GitHub app on the repo** — it must be reviewing before the first Phase 1 PR.
2. **Biome.** Install `@biomejs/biome` (dev). Copy `G:\apps\gateling.com\biome.json` and adjust paths. Remove any ESLint remnants. Scripts: `"lint": "biome check ."`, `"format": "biome format --write ."`.
3. **Scripts.** Add: `"typecheck": "tsc --noEmit"`, `"check": "npm run typecheck && npm run lint"`, `"audit:gate": "npm audit --audit-level=low"`. Every phase gate runs `check` + `build` + `audit:gate`.
4. **Postgres.** Copy `G:\apps\gateling.com\docker-compose.yml`, rename container/db to `gateling_tms`, distinct port. `docker compose up -d` and verify connection.
5. **Env validation.** Install `@t3-oss/env-nextjs` + `zod`. Create `src\data\env\server.ts` + `client.ts` (pattern: DONOR-B or SOURCE `src\data\env\`). Start with `DATABASE_URL` only; phases append. `.env` gitignored, `.env.example` committed.
   **Hosting + preview/prod DBs (`06-workflow.md` §5):** create the **Vercel** project linked to the GitHub repo (preview deploys per PR) and the **Neon** project (main branch = production DB; per-PR preview branches — use the Neon/Vercel integration if available, else document the branch-per-preview procedure in TARGET `docs\deploy.md`). Populate Vercel **Preview** and **Production** env scopes separately as vars appear — never share values across scopes. Wire `db:migrate` into the deploy step so preview/prod DBs migrate on deploy.
6. **Folder skeleton.** Create the empty tree from `01-architecture.md` (features/core, features/system, components/forms, integrations, drizzle, app groups `(landing)`, `(system)`, `auth`, `api`).
7. **shadcn/ui.** `npx shadcn@latest init` — copy config choices from `G:\apps\gateling.com\components.json`. Add the base primitives used everywhere: button, input, label, card, dialog, dropdown-menu, select, table, tabs, badge, alert, sonner, tooltip, popover, checkbox, separator, sheet, skeleton.
8. **Test harnesses.** Install `vitest` + `@playwright/test` (dev). Copy configs from `G:\apps\gateling-software-team\vitest.config.ts` and `G:\apps\gateling.com\playwright.config.ts`; create `tests\` (one placeholder unit test) and `e2e\` (one smoke test: home page renders). Scripts: `"test": "vitest run"`, `"test:e2e": "playwright test"`.
9. **Target docs.** Create TARGET `docs\STATE.md` (copy shape from this blueprint's STATE.md; seed its decision log with D1–D16) and `docs\decisions\adr-001-rebuild-baseline.md` (one page: stack + links back to this blueprint folder). Pattern: `G:\apps\gateling-software-team\docs\`.
10. **Mirror the blueprint into the repo.** Copy the entire blueprint folder `C:\Users\moham\OneDrive\Desktop\gateling-tms\docs\rebuild\` → TARGET `docs\rebuild\` and commit it, so the plan is versioned on GitHub alongside the code. **Canonical rule:** until Phase 8 cut-over, the Desktop copy remains the single source of truth (the kickoff command points there and STATE.md is updated there); at every phase close-out, re-mirror the Desktop folder into TARGET `docs\rebuild\` in that phase's final PR so the repo copy never drifts more than one phase behind. Never edit the repo copy directly before cut-over.
11. **README.** Replace boilerplate with a short real README (what Gateling-TMS is, dev setup: docker, env, scripts). SOURCE's README was untouched t3 boilerplate — don't repeat that.

## Verification gate

- [ ] `npm run check` green, `npm run build` green, `npm test` + `npm run test:e2e` green (placeholders pass)
- [ ] `npm run audit:gate` → **0 vulnerabilities**
- [ ] No package outside `02-dependencies.md` Phase-0 list
- [ ] Grep repo for `HBS` → zero hits
- [ ] GitHub repo exists and mirrors local; CodeRabbit installed (verify: open a trivial test PR, confirm CodeRabbit comments, let Mohamed merge it — this also rehearses the merge loop)
- [ ] Vercel preview deploy succeeds for that test PR; Neon prod DB reachable with prod `DATABASE_URL` in the Production scope only

## Close out

Update blueprint `STATE.md`: Phase 0 → ☑ with date, note deviations, set **Next action** to phase-01 step 1. Commit (`feat: phase 0 — repo init & tooling`).
