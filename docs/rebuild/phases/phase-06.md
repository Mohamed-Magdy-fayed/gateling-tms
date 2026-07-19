# Phase 6 — Live Classes (Zoom)

**Goal:** deliver the "powered by Zoom" promise: orgs connect Zoom accounts, group sessions become real Zoom meetings, attendance is tracked automatically.
**Prerequisites:** Phase 5 gate (sessions exist). **Reference docs:** `00-product-spec.md` (Live Classes rows), `04-code-donors.md`.

SOURCE is the only donor with Zoom code — adapt, don't copy blindly (fix tenancy + i18n + branding):
`C:\Users\moham\OneDrive\Desktop\gateling-tms\src\lib\zoom\{onmeeting,meeting-helpers,types}.ts`, `src\server\api\routers\learning-flow\zoom-clients-router.ts`, `src\app\api\webhooks\zoom\route.ts`, `src\server\services\inngest\functions\zoom-clients.ts`.

## Steps

1. **Zoom app + env.** Zoom OAuth app (client id/secret, redirect, webhook secret token) → t3-env + STATE.md env list. Document the Zoom marketplace setup steps in TARGET `docs\integrations-zoom.md` as you go (scopes: meeting write, recording read, webhook events).
2. **Zoom clients.** `features\system\live-classes\zoom-clients\`: connect flow (OAuth authorize → callback → store tokens in `zoom_clients`, org-scoped), token refresh handling, disconnect. Multiple clients per org supported (SOURCE model). Authorization handled via Inngest (`zoom_client/handle_authorization` — SOURCE function as reference).
3. **Session ↔ meeting linking.** Phase-5-generated `zoom_sessions` get real Zoom meetings: on session create/update (Inngest) call Zoom API via the org's client → store meeting id/join/start URLs. Sessions without a connected client stay "offline" gracefully — Zoom is optional, not a blocker (a free org without Zoom still schedules classes).
4. **Sessions UI.** Session list (per group + org calendar/agenda view): join links for teacher (start_url) and students (join_url), status (upcoming/live/ended), recording links when available.
5. **Webhook.** `app\api\webhooks\zoom\route.ts` (SOURCE route as base): validate signature; handle meeting started/ended, participant joined/left, recording completed → update session status, write attendance to `session_students`, attach recording link. Webhook → Inngest event → function (keep the HTTP handler thin).
6. **Attendance.** Per-session attendance view (auto from webhooks + manual override by teacher); per-trainee attendance feeds the Phase-5 progress view. This makes the SOURCE nav-stub "Attendance" real.
7. **Copy check.** Wherever Live Classes surfaces in-app, wording matches the landing promise: streaming/whiteboard/recording/screen-share happen **in Zoom**; the system manages scheduling, links, attendance, recordings.
8. **Tests.** vitest: webhook signature validation, attendance mapping from participant events (fixture payloads). Org isolation on zoom tables.

## Verification gate

- [ ] With a real/sandbox Zoom account: connect client → group session becomes a Zoom meeting → join as teacher + participant → end → attendance rows appear → (if enabled) recording link attached. **If no Zoom account is available this session: perform the full flow against recorded fixtures, mark the gate "passed-with-fixtures" in STATE.md, and leave a blocker line to verify live before launch.**
- [ ] Org without Zoom client: sessions still schedule and display as offline — nothing breaks
- [ ] Webhook rejects bad signatures
- [ ] EN/AR parity; `check` + `build` + `test` + `audit:gate` green

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① zoom clients + OAuth, ② meeting linking + sessions UI, ③ webhook + attendance) — each merged by Mohamed. Then update blueprint `STATE.md`; next action → phase-07.
