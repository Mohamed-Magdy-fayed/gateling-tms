# Gateling-TMS Rebuild Blueprint

This folder is the **complete, self-contained plan** for rebuilding Gateling-TMS from scratch as a clean, multi-tenant, free-to-start training management system. It contains **no code** — only instructions, references, and progress state. Any agent session can pick up the work using only this folder.

## Kickoff command (paste into any new agent session)

```
Read G:\apps\gateling-tms\docs\rebuild\README.md and
G:\apps\gateling-tms\docs\rebuild\STATE.md, then continue the
Gateling-TMS rebuild from the phase and "Next action" recorded in STATE.md. Open the
matching phase file in docs\rebuild\phases\, execute its steps in order, run its
verification gate, and update STATE.md (status, checklists, decisions, next action)
before stopping. Never violate docs\rebuild\02-dependencies.md.
```

> Canonicity moved from the Desktop SOURCE copy to this repo copy on 2026-07-23, ahead of
> the originally planned Phase 8 cut-over (see "Blueprint mirror" below and STATE.md D50)
> — start every new session from this path, not `C:\Users\moham\OneDrive\Desktop\gateling-tms\docs\rebuild\`.

## The four source repositories

| Alias | Path | Role |
|---|---|---|
| **SOURCE** | `C:\Users\moham\OneDrive\Desktop\gateling-tms` | The old app. Product spec (landing pages), domain schema, Zoom + Google Forms code. Never copied blindly — it has vulnerable deps and design flaws. |
| **DONOR-B** | `G:\apps\gateling.com` | Platform-core donor: data table, forms, auth, i18n, tRPC, Inngest, Firebase, seed harness, tenancy model. Copy core subsystems from here. |
| **DONOR-A** | `G:\apps\atelier-management-system` | Entity-CRUD pattern donor (table page + form dialog + router + tenant-scoped schema). Data-table core is byte-identical to DONOR-B — use B's copy. |
| **DONOR-C** | `G:\apps\gateling-software-team` | Discipline donor: `docs\STATE.md` pattern, ADRs, vitest + Playwright setup, nodemailer ^9.0.3 usage. |

**TARGET** (the new app being built): `G:\apps\gateling-tms`, package name `gateling-tms`.

## Reading order for a fresh session

1. `README.md` (this file) — rules and layout.
2. `STATE.md` — where the work currently stands. **The single source of truth for progress.**
3. `phases\phase-0N.md` for the current phase — the actual steps.
4. `06-workflow.md` — **how to work**: segments, commits, PRs, CodeRabbit, environments. Read once per session.
5. Only if the phase references them: `00-product-spec.md` (what we promise), `01-architecture.md` (how it's built), `02-dependencies.md` (what we may install), `03-data-model.md` (schema), `04-code-donors.md` (copy map), `05-roadmap.md` (deferred paid modules).

## Non-negotiable rules (apply to every phase)

1. **Dependency policy is law.** Only packages/versions listed in `02-dependencies.md` may be installed. `npm audit` must report **0 vulnerabilities** at every phase gate. A new dependency requires an audit check plus a decision note in STATE.md.
2. **Phase gates.** A phase is complete only when its verification gate passes: `typecheck` + `build` green, audit clean, and the phase's functional checks done. Record gate results in STATE.md.
3. **STATE.md is updated before the session ends** — status, completed steps, decisions made, blockers, and a one-line "Next action" a future agent can execute without context.
4. **Bilingual always.** Every user-visible string exists in both `en.ts` and `ar.ts` in the same change. RTL-safe CSS only (logical properties: `ms-`, `me-`, `ps-`, `pe-`).
5. **Branding: "Gateling-TMS" / "Gateling" everywhere.** The string "HBS" must never appear in the new app (SOURCE has it in copy and the Inngest app id — do not carry it over).
6. **Tenancy invariant.** Every tenant-owned table carries `organizationId`; every query in org context filters by it (via the `orgProcedure` helper — see `01-architecture.md`).
7. **Migrations are generated** (`db:generate` → `db:migrate`), committed together with `meta/` + `_journal.json`. Never `db:push`, never hand-written structural SQL. Hand-written SQL is allowed only for data migrations, committed with a note.
8. **Inngest for anything the user shouldn't wait for** (emails, media processing, cascade deletes, session generation). Adopt DONOR-B's `G:\apps\gateling.com\docs\inngest-offload-policy.md` as the rule.
9. **Landing pages must stay truthful.** V1 ships only free-tier features; every promised free bullet maps to a built feature (`00-product-spec.md` has the mapping); paid modules appear only as "coming soon" (`05-roadmap.md`).
10. **Instant onboarding.** No workflow may require master-data setup before a user can add classes/students and start working. If a step forces prep work, it violates the product spec.
11. **Work in segments through PRs — Mohamed merges.** Every segment: branch → commit after every coherent change → push → PR with how-to-test → fix **all** CodeRabbit feedback → ask Mohamed to merge → iterate. Never commit to master directly, never self-merge. Localhost must stay runnable after every commit. Full contract: `06-workflow.md`.
12. **Human-readable, maintainable code.** Descriptive names, small functions/files, one consistent entity pattern, comments only for the why, no `any`, no console.log. Standards: `06-workflow.md` §4. Donor code gets cleaned while ported, not pasted.
13. **Three separated environments.** dev = local Docker Postgres; preview = Vercel preview + Neon branch DB per PR; prod = Vercel + Neon main. Fully separate env vars per environment; migrations generated in the PR and applied dev → preview → prod per `06-workflow.md` §5.

## Folder layout

```
docs\rebuild\
├── README.md            ← you are here
├── STATE.md             ← living progress tracker (always update)
├── 00-product-spec.md   ← promises, personas, journey, plan limits
├── 01-architecture.md   ← stack, folder layout, key decisions
├── 02-dependencies.md   ← approved + banned dependency lists
├── 03-data-model.md     ← full target schema with source references
├── 04-code-donors.md    ← subsystem-by-subsystem copy map
├── 05-roadmap.md        ← deferred paid modules ("coming soon")
├── 06-workflow.md       ← segments, git/PR/CodeRabbit loop, environments, code standards
└── phases\
    ├── phase-00.md  Init & tooling
    ├── phase-01.md  Core platform (i18n, forms, data table, tRPC, drizzle, Inngest, Firebase)
    ├── phase-02.md  Auth, organizations, onboarding
    ├── phase-03.md  Landing pages
    ├── phase-04.md  Content Library
    ├── phase-05.md  Learning Flow
    ├── phase-06.md  Live Classes (Zoom)
    ├── phase-07.md  Excel + Google Forms import
    └── phase-08.md  Limits, polish, launch
```

Phases are sequential; each assumes all previous gates passed. Within a phase, steps are ordered but an agent may parallelize independent steps.

## Blueprint mirror in the target repo

**This repo copy (`G:\apps\gateling-tms\docs\rebuild\`) is canonical as of 2026-07-23** (STATE.md D50) — update it directly, same as any other file in this repo, through the normal branch → PR → CodeRabbit → merge workflow (`06-workflow.md`). The original plan was to keep the Desktop SOURCE copy (`C:\Users\moham\OneDrive\Desktop\gateling-tms\docs\rebuild\`) canonical until the Phase 8 cut-over and mirror into the repo per phase; Mohamed moved the cutover earlier instead, since the repo copy is what's actually versioned with the code and what every session should be reading from. The Desktop copy is retired — do not read or write it.
