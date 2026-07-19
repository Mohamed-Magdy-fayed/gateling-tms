# Phase 8 — Limits, Polish, Launch

**Goal:** free-plan limits airtight, the full product-spec journey green in Playwright, seed/demo data, and a launch checklist passed.
**Prerequisites:** Phases 0–7 gates. **Reference docs:** `00-product-spec.md` (journey = the e2e script), `02-dependencies.md`, `05-roadmap.md`.

## Steps

1. **Limits sweep.** Audit every write path against AD-6: students (50), courses (5), storage (1 GB) enforced at create/upload incl. imports; friendly limit UI everywhere (consistent component: current usage, cap, "paid plans coming soon" pointer — no dead upgrade button). Add the Inngest **reconciliation function** (nightly + on-demand): recompute counters from truth, correct drift, log discrepancies.
2. **Usage visibility.** Org settings page: plan card (Free), usage meters (students/courses/storage), member management (invite/remove/change role — Phase 2 flows surfaced properly).
3. **Seed profiles.** Finalize B-pattern profiles: `baseline` (dev minimum), `demo` (realistic academy: 2 courses w/ levels+lectures+quiz, 3 groups w/ schedules+sessions, 25 students w/ enrollments/attendance/certificates — the screenshot/demo dataset), `performance` (near-limit volumes: 50 students, 5 courses — limit UIs visible). Document in TARGET `docs\seeding-and-demo-data.md` (B's doc as template).
4. **Full-journey e2e.** Playwright implementation of the `00-product-spec.md` acceptance script, steps 1–11: landing → signup → verify (dev-mode token capture) → org → **zero-master-data class creation** → student import (fixture file) → assign → sessions (Zoom mocked/fixtures) → quiz via Google-import fixture or builder → placement → progress → certificate → hit a limit. EN run + AR/RTL smoke of the critical screens. Wire `test:e2e` into the check pipeline.
5. **Hardening pass** (DONOR-C's security-review checklist in its `docs\STATE.md` is the reference bar): rate limits on auth + public endpoints (tRPC batch cap), security headers in `next.config.ts`, error messages don't leak internals (B `db-error.ts` formatter), upload type/size validation, webhook signature tests, no secrets in repo (scan), org-isolation test suite covers **every** tenant table.
6. **Ops readiness.** Production env checklist in TARGET `docs\deploy.md` (env matrix per `06-workflow.md` §5): **Neon** main branch (prod) + preview branching healthy, Vercel Production scope complete (Upstash, SMTP, Firebase, Inngest keys, Zoom prod app + webhook URL, Google OAuth prod origins), `db:migrate` verified in the deploy step against Neon, Neon backup/restore note. Confirm preview→prod parity: the last merged PR's preview behaved identically to prod post-deploy.
7. **Demo-readiness checklist.** Create TARGET `docs\demo-readiness-checklist.md` from B's pattern; walk it: every landing claim demoable on seed data, both languages, mobile viewport sanity on core flows.
8. **Final audit + docs.** `npm run audit:gate` → 0. Update TARGET `README.md` + `docs\STATE.md` to "v1 complete". Tag `v1.0.0`.

## Verification gate (= launch bar)

- [ ] Full-journey e2e green (EN + AR smoke), unit suite green, `check` + `build` green
- [ ] `npm audit` → **0 vulnerabilities**; `02-dependencies.md` ledger still empty (or accurately filled)
- [ ] All three limits provably enforced (tests + manual)
- [ ] Org-isolation suite covers every tenant-owned table
- [ ] Demo-readiness checklist signed off in STATE.md
- [ ] Landing-truth final walk: every visible claim works on the demo seed

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① limits sweep + reconciliation + usage UI, ② seeds + full-journey e2e, ③ hardening + ops docs + checklist) — each merged by Mohamed; tag `v1.0.0` after the final merge. Blueprint `STATE.md`: Phase 8 ☑, **rebuild complete**; hand ongoing state to TARGET `docs\STATE.md`. **Blueprint cut-over:** final re-mirror Desktop → TARGET `docs\rebuild\`, add a "canonical from <date>; Desktop copy archived" note at the top of both copies — from here the repo copy is the source of truth. Next fronts live in `05-roadmap.md` (billing first) — each starts with a Q&A spec session with Mohamed.
