# TODOS

## Billing

### Gate Gateling Meetings behind a paid TMS plan

**What:** Require a paid plan (basic+) to start a live class on Gateling Meetings.

**Why:** Meetings is Gateling's own service, and Mohamed wants it included in a paid TMS plan rather than sold as a separate subscription.

**Context:** Deferred from the academy-preferences eng review (docs/designs/academy-preferences.md, ledger R7, D4). `organizations.plan` exists, and `PLAN_LIMITS` in `src/features/core/organizations/server/limits.ts` already enforces students/courses/storage. Nothing checks the plan at class start. It must ship together with the owner plan-grant action (R8) so comped academies keep classes. Roadmap rule: spec this in the Billing & Paymob session first (docs/rebuild/05-roadmap.md item 7).

**Effort:** S
**Priority:** P2
**Depends on:** Billing & Paymob spec session; owner plan-grant action (R8)

## Design

### Write DESIGN.md for Gateling-TMS

**What:** Run /design-consultation to produce a DESIGN.md: type, color tokens, spacing, component rules, RTL rules.

**Why:** Design reviews and /ui-scan currently reverse-engineer conventions from code; a written system keeps new screens consistent as more academies onboard.

**Context:** Flagged by /plan-design-review on docs/designs/academy-preferences.md (2026-09-24, D14). Existing kit: src/components/ui (Card, Alert, EmptyState, Tag, Switch, Select, InputGroup, DataTable). Not a blocker for the academy-preferences build.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Completed
