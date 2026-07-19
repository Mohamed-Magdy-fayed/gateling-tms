# ADR-001: Rebuild baseline stack

- **Date:** 2026-07-19
- **Status:** accepted

## Context

Gateling-TMS (SOURCE, `C:\Users\moham\OneDrive\Desktop\gateling-tms`) audits at
13 vulnerabilities and has design flaws (JWT sessions, partial tenancy scoping,
squashed migrations). Rather than patch in place, the full app is rebuilt from
scratch as a clean, multi-tenant, free-to-start training management system,
following the shared Gateling stack used across the owner's other projects.

## Decision

Stack: Next.js 16 (App Router) + React 19.2, TypeScript strict, Tailwind 4 +
shadcn/ui, tRPC 11, Drizzle ≥0.45.2 + PostgreSQL (postgres.js driver), custom
auth (Redis sessions + Google OAuth + passkeys), TanStack Form + Zod 4,
Inngest 4, Firebase Storage, nodemailer ≥9.0.3, Biome 2.x, vitest + Playwright.

Platform core (data table, forms, auth, i18n, tRPC, Inngest, Firebase) is
ported from DONOR-B (`G:\apps\gateling.com`); entity-CRUD pattern from
DONOR-A (`G:\apps\atelier-management-system`); process discipline (STATE.md,
ADRs, test setup) from DONOR-C (`G:\apps\gateling-software-team`).

Full rationale, dependency policy, data model, and phase-by-phase plan live in
`docs/rebuild/` (mirrored from the canonical copy — see `docs/STATE.md`).

## Alternatives considered

- **Patch SOURCE in place:** rejected — the vulnerable dependency chain
  (`next-auth`, old `nodemailer`/`drizzle-orm`) and the partial-tenancy schema
  design are structural, not surface-level; patching would cost more than a
  clean rebuild against a proven donor stack.
- **New framework/stack divergence:** rejected for the same reason as
  DONOR-C's ADR-001 — consistency with the owner's other Gateling codebases
  outweighs any per-project optimization.

## Consequences

Every tenant-owned table carries `organizationId` from day one. Migrations
are generated-only. Dependency versions are pinned to the audit-clean floor
in `docs/rebuild/02-dependencies.md`, checked at every phase gate.
