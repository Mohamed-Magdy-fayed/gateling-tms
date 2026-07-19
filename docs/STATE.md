# Rebuild State (repo mirror)

> This is a mirror of the canonical rebuild state. **Until the Phase 8 cut-over,
> the single source of truth is** `C:\Users\moham\OneDrive\Desktop\gateling-tms\docs\rebuild\STATE.md`
> on Mohamed's machine — that file is updated every session; this copy is
> refreshed from it at each phase's final PR (see `docs/rebuild/README.md`).
> After Phase 8 cut-over, canonicity transfers here.

## Status

- **Current phase:** Phase 0 — Init & tooling (in progress)
- **Target repo:** `G:\apps\gateling-tms` (this repo)

## Phase checklist

| Phase | Status |
|---|---|
| 0 — Init & tooling | ◐ in progress |
| 1 — Core platform | ☐ not started |
| 2 — Auth, orgs, onboarding | ☐ not started |
| 3 — Landing pages | ☐ not started |
| 4 — Content Library | ☐ not started |
| 5 — Learning Flow | ☐ not started |
| 6 — Live Classes (Zoom) | ☐ not started |
| 7 — Excel + Google Forms import | ☐ not started |
| 8 — Limits, polish, launch | ☐ not started |

## Decisions log (D1–D16)

See `docs/rebuild/STATE.md` in this repo (mirrored blueprint copy) for the full
decisions log, D1 through D16, confirmed with Mohamed 2026-07-19. Highlights:

- D1: Single Next.js app, no monorepo.
- D2: V1 scope = free tier only (Content Library, Learning Flow, Live Classes).
- D3: Platform core copied from DONOR-B (`gateling.com`).
- D4: Tenancy = shared-schema row-level, `organizationId` on every tenant table.
- D12: Delivery model = segments → PRs → CodeRabbit fixes → Mohamed merges.
- D13: Neon (prod + per-PR preview branches) + local Docker Postgres for dev.
- D14: Vercel hosting, per-PR preview deployments.

New decisions are appended as D17, D18, … in the canonical STATE.md first,
then mirrored here.
