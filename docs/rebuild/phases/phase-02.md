# Phase 2 — Auth, Organizations, Onboarding

**Goal:** complete multi-tenant identity: signup → email verify → org created on Free plan → dashboard, with Google OAuth, passkeys, org switching, and `orgProcedure` enforcing tenancy.
**Prerequisites:** Phase 1 gate. **Reference docs:** `01-architecture.md` (AD-1/AD-2), `03-data-model.md`, `04-code-donors.md`.

## Steps

1. **Auth core.** Copy B `G:\apps\gateling.com\src\features\core\auth\core\` → `src\features\core\auth\core\`: `session.ts` (Upstash Redis sessions, `session-id` cookie, 7-day), `passwordHasher.ts`, `token.ts`, `permissions.ts`, `helpers.ts`, `oauth\{base,google}.ts`. Rename env/cookie identifiers for gateling-tms. **Do not** port SOURCE's JWT session (10-min expiry — rejected, D5).
2. **Email.** `nodemailer` ^9.0.3 transport in `src\integrations\email.ts` (B `src\integrations\email.ts` wiring; C `src\server\email.ts` as the ^9 reference). Adapt B's auth email templates (verification, password reset, invitation) → TMS branding, EN/AR. Sending goes through Inngest (`user/registered` → send-verification function).
3. **Auth flows + UI.** Copy/adapt B's auth nextjs layer (actions, sign-in/up components, passkey-manager) under `src\features\core\auth\` + pages in `app\auth\`. Flows: password sign-up/sign-in, Google OAuth (B pattern + `app\api\oauth\[provider]` route, Google only), email verification (24 h token), password reset, passkey register/login (@simplewebauthn 13). Rate-limit auth endpoints with `@upstash/ratelimit` (B `ratelimit` usage or SOURCE's as reference).
4. **Organizations feature.** `src\features\core\organizations\`: org CRUD, memberships with role (`admin|teacher|student`), invitation flow (token → email → accept), org-switcher UI + active-org in session — all adapted from B's branches feature + branch-provider (rename branch→organization). Plan fields per `03-data-model.md` (plan enum default `free`, usage counters). Limit-check helpers (`assertCanAddStudent`, `assertCanAddCourse`, `assertStorageBudget`) — implemented now, enforced in domain phases.
5. **`orgProcedure`.** Replace the Phase-1 stub: session → user → active org membership (else UNAUTHORIZED/FORBIDDEN) → inject `ctx.organizationId` + `ctx.role`. Role-restricted variants (`orgAdminProcedure`). Every domain router from here on builds on these.
6. **Proxy gating.** Finish `src\proxy.ts` from B: `(system)` routes require session; unauthed → sign-in; authed-without-org → onboarding.
7. **Onboarding wizard.** Rebuild SOURCE's get-started as `app\(landing)\get-started\` on `useAppForm`: Step 1 business info (contact name, business name, email, phone — SOURCE `get-started\schema.ts` zod as reference) → Step 2 review & submit. (SOURCE's feature-multi-select step is dropped — v1 is free-tier only.) Submit: create user (unverified) + organization (free plan) + admin membership → fire `user/registered` → verify-email screen (SOURCE `verify-email\` flow as reference) → post-verify optional passkey prompt (skippable) → dashboard. Also support the inverse order (OAuth first → then org-create step) — whichever entry, the invariant is: verified user + org + membership before entering `(system)`.
8. **Dashboard shell.** `(system)` layout: sidebar (B/SOURCE sidebar patterns; nav = Dashboard, Content Library, Learning Flow, Live Classes + General links — no dead links), org-switcher, user card, locale switcher, placeholder dashboard page.
9. **Seed.** Finish baseline profile: dev org + verified admin (known password) + a teacher and 2 students. `db:seed` documented in README.
10. **Unit tests (vitest).** Limit-check helpers; membership role logic; token expiry.

## Verification gate

- [ ] Full journey in browser: get-started → email verify (dev SMTP/log transport) → passkey prompt (skip) → dashboard, in EN and AR
- [ ] Google OAuth round-trip works; second sign-in reuses the account
- [ ] Passkey register + login works
- [ ] Session survives restart (Redis), expires per config; sign-out clears
- [ ] `orgProcedure`: cross-org access attempt returns FORBIDDEN (write a test: user of org A queries org B data via a demo endpoint)
- [ ] Proxy: unauthed hit on `(system)` redirects to sign-in
- [ ] `check` + `build` + `test` + `audit:gate` (0 vulns) green

## Close out

Deliver as segment PRs per `06-workflow.md` (suggested split: ① auth core + email, ② flows/UI + OAuth + passkeys, ③ organizations + orgProcedure + proxy, ④ onboarding wizard + dashboard shell + seed) — each merged by Mohamed. Then update blueprint `STATE.md`; next action → phase-03.
