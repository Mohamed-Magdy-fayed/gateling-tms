# 05 — Roadmap (Deferred / "Coming Soon" Modules)

Everything the old landing pages promised that v1 does **not** build. Landing pages show these as **"coming soon"** (Phase 3). Promised bullets are preserved **verbatim** from SOURCE `src\app\(landing-pages)\features\_translations\features-en.ts` so future work delivers exactly what was advertised.

> **Rule (confirmed by Mohamed):** none of these modules may be built before a dedicated **Q&A spec session with Mohamed** that turns its bullets into a real spec — exactly like the 2026-07-19 session that scoped v1. An agent that finds itself implementing any module below without a spec doc referenced in STATE.md must stop.

## Module ledger

### 1. HR Management (paid — Basic+)
Promised: Staff Management · Payroll Integration · Performance Tracking · Attendance Monitoring.
Existing material: SOURCE `src\app\(system-pages)\hr\` (4 team pages, roles in `hr\_constants\roles.ts`) — staff CRUD only; payroll/performance have **no prior code** (were marketing-only).
Notes for future spec: staff = org members with expanded roles; payroll is Egypt-specific (needs provider research).

### 2. Course Store (paid — Basic+)
Promised: Online Course Marketplace · Payment Processing · Course Packaging & Pricing · Sales Analytics.
No prior code in SOURCE. Depends on billing/payments foundation (Paymob, below). Re-enables trimmed enrollment states `orderCreated/orderPaid/refunded` (see `03-data-model.md`).

### 3. CRM System (paid — Professional+)
Promised: Lead Management · Detailed Student Profiles · Communication History · Enrollment Tracking.
No prior code in SOURCE. DONOR-B has a working leads pipeline (`G:\apps\gateling.com\src\integrations\trpc\routers\leads.ts` + `on-lead-submitted` / `on-lead-status-changed` Inngest functions) — strong donor when spec'd.

### 4. Smart Forms — standalone (paid — Professional+)
Promised: Custom Form Builder · Automated Data Collection · Workflow Automation · System Integration.
v1 already ships the **course-scoped** form builder (assessments); this module is the org-wide standalone version with workflow automation. Builder code will be reusable from `features\system\assessments\`.

### 5. Community Platform (paid — Enterprise)
Promised: Discussion Forums · Student Groups · Social Learning Features · Peer-to-Peer Interaction.
No prior code in SOURCE.

### 6. Support System (paid — Enterprise)
Promised: Ticketing System · Live Chat Support · Knowledge Base · Priority Support.
No prior code in SOURCE. Also: SOURCE sidebar linked to unbuilt `/documentation` and `/support` routes — v1 must not repeat that (no dead links).

### 7. Billing & Paymob (infrastructure for all paid tiers)
Promised on pricing page: Paymob payments (cards, Fawry, Vodafone Cash, bank transfer), monthly/yearly cycles, 30-day money-back.
No prior code (PLAN_CONFIGS is static). Schema is upgrade-ready: `organizations.plan` + limits (AD-6). Needs: subscriptions/invoices tables, Paymob integration, plan up/downgrade flows, proration policy. **First candidate to spec** — it unlocks every paid tier.

### 8. Smaller deferred items
- Parent accounts/portal (`users.parentId` kept in schema, no UI).
- GitHub/Microsoft OAuth (SOURCE had them; v1 is Google-only — D5).
- FCM push notifications (SOURCE Firebase service had it).
- Postgres RLS as tenancy defense-in-depth (AD-1 note).
- MDX-based lecture authoring (banned deps; revisit safe editor ≥4.0.4 if rich text proves insufficient).
- Attendance page in nav (SOURCE had nav-only stub) — v1 builds real attendance in Phase 6; anything beyond per-session tracking (reports/exports) lands here.

## Suggested order (when Mohamed opens the next front)

1. Billing/Paymob (unlocks revenue) → 2. HR (Basic tier complete) → 3. Course Store (Basic complete) → 4. CRM → 5. Smart Forms standalone (Professional complete) → 6. Support → 7. Community (Enterprise complete).
