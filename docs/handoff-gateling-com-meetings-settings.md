# Handoff: move the Meetings credentials from env to settings in gateling.com

Copy everything below the line into a fresh Claude Code session opened in
`G:\apps\gateling.com`. (This file is a one-off handoff for that session; it
can be deleted once the work lands there.)

---

Move the Gateling Meetings integration's credentials out of environment
variables and into the `settings` table, managed on the existing `/settings`
admin page — the same thing that was just done in `G:\apps\gateling-tms`
(read `docs/integrations-meetings.md` §1–§2 there, and the files it names,
before starting; mirror that shape rather than inventing a new one).

## Why

Every Gateling system connects to Meetings the same way: an admin creates the
integration on `meetings.gateling.com/settings/integrations` (name, webhook
URL, allowed return origins), then pastes the API key and webhook secret into
the *target* system's settings page. Env vars break that — they need a
redeploy, and they aren't where the other integrations (WaPilot) already live
in this repo.

## Current state in this repo

- `src/env/server.ts` declares `MEETINGS_API_URL`, `MEETINGS_API_KEY`,
  `MEETINGS_WEBHOOK_SECRET` (optional, with a "key requires URL + secret"
  refinement). Remove all three and the refinement; strip them from
  `.env.example`.
- The client block `src/integrations/meetings/*` is the
  `@gateling/meetings-integration` registry block — **do not edit it**. Its
  `getMeetingsClient()` / `isMeetingsConfigured()` read `process.env`; stop
  calling them and build the client from settings with the block's
  `createMeetingsClient({ baseUrl, apiKey })` instead. `readMeetingsEnv` /
  `isAllowedMeetingsApiUrl` can stay unused in the block.
- Callers to switch (grep `getMeetingsClient` / `isMeetingsConfigured` /
  `MEETINGS_WEBHOOK_SECRET` outside `src/integrations/meetings/`):
  `src/app/api/meetings-webhook/route.ts`,
  `src/features/system/bookings/server/router.ts`,
  `src/features/system/sales/server/router.ts`, and the Inngest functions
  `on-booking-confirmed`, `on-booking-cancelled`,
  `on-booking-meeting-requested`, `on-lead-demo-scheduled`,
  `on-meetings-webhook`.
- The settings feature already exists: `src/drizzle/schemas/system/settings-table.ts`,
  `src/features/system/settings/lib/system-settings-registry.ts` (codes
  `00001`–`00017`, `WAPILOT_API_TOKEN` / `WAPILOT_WEBHOOK_SECRET` are the
  precedent for credentials), `server/{queries,mutations,router}.ts`,
  `admin/settings-table-page.tsx`, `src/drizzle/seed/settings.ts`, i18n keys
  `settingName000NN` / `settingDesc000NN` in `src/features/core/i18n/global/{en,ar}.ts`.

## What to build

1. **Three new registry entries** — next free codes (`00018`, `00019`,
   `00020`), `label: "integration"`:
   - `MEETINGS_API_URL` — editable value, seed `https://meetings.gateling.com`,
     `validateValue` = https only, `http` allowed for `localhost` /
     `127.0.0.1` only (the key travels in a header to this host).
   - `MEETINGS_API_KEY` — editable value, seed null.
   - `MEETINGS_WEBHOOK_SECRET` — editable value, seed null.
   Add `nameKey`/`descriptionKey` unions, `descriptionEn`, and the EN + AR
   i18n strings. Extend `src/drizzle/seed/settings.ts` if it enumerates codes.
2. **A settings-backed resolver** (suggested:
   `src/features/system/meetings/config.ts`, next to `host.ts`):
   `resolveMeetingsConfig(db)` → `{ apiUrl, apiKey, webhookSecret } | null`
   (null unless URL **and** key are set — never a half-config);
   `resolveMeetingsClient(db)` memoised per URL+key via `createMeetingsClient`;
   `isMeetingsConfigured(db)`; `resolveMeetingsWebhookSecret(db)`. Read per
   call — one indexed lookup — so a rotated key takes effect on the next
   request, not after a deploy. Route all callers listed above through it.
   Inside Inngest steps, load the client *inside* the step (the repo's
   `meeting-loaders.ts` note about `step.run` serialisation applies).
3. **Webhook route**: read the secret from settings per delivery and pass it to
   `createMeetingsWebhookHandler({ secret, onDelivery })(request)` inside an
   `async function POST`. Unset → the handler already answers 503 so Meetings
   keeps retrying.
4. **Secrets never echo back.** If the settings grid currently returns `value`
   for every row to the admin UI, treat `WAPILOT_API_TOKEN`,
   `WAPILOT_WEBHOOK_SECRET`, `MEETINGS_API_KEY` and `MEETINGS_WEBHOOK_SECRET`
   as secrets: list reports `hasValue` only, the edit dialog shows an empty
   field with a "paste to replace" placeholder, saving replaces wholesale,
   clearing (empty value) disconnects. Add an `isSecret` flag to the registry
   definition rather than special-casing codes.
5. **Docs**: update `docs/meetings-integration.md` "Configuration" (the env
   block becomes "set on `/settings`"; the failure-mode bullet "Not configured
   (`MEETINGS_API_KEY` empty)" becomes "not set on `/settings`"), the ADR only
   if it mentions env, and any deploy/README env tables. Mention that the
   `/settings` page should show this deployment's webhook URL
   (`<origin>/api/meetings-webhook`) and origin, since those are what the
   Meetings integration form asks for — the TMS page does this with a
   `useSyncExternalStore`-read `window.location.origin`.
6. **Tests**: unit tests for the new registry entries (secret flags, URL
   validator, seed defaults) and for the resolver's null-on-half-config rule;
   keep `bookings/server/meeting.test.ts` and the block's specs green;
   `e2e/meetings-access.spec.ts` still passes.

## Rules that apply here

- Schema-first, generated migrations only (`npm run db:generate`, then
  `db:migrate`; never hand-written, never `db:push`). No schema change is
  expected — the table exists; the new rows are seed/ensure-on-first-use data.
- Every user-visible string through `t()`, EN and AR in the same change.
- Gate: `npm run check && npm run test:unit && npm run build` before calling
  it done. Report faithfully if the repo's lint is already red on files you
  didn't touch — fix only what you touched.
- Don't commit or push unless asked; summarise what an operator must do once
  it ships (paste the key/secret on `/settings` for Preview and Production
  separately, then delete the three `MEETINGS_*` Vercel env vars).
