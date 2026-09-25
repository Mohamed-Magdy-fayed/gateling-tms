# Gateling Meetings integration

Live Classes run on **Gateling Meetings** (`https://meetings.gateling.com`,
repo `gateling-meetings`) — our own video platform, replacing onMeeting
(which itself replaced the direct Zoom integration; see `docs/rebuild/STATE.md`
D142 for that history).

The shape is the one every Gateling system uses to talk to Meetings
(`gateling-meetings/docs/integration.md`): this app's server calls the
Meetings REST API with **one deployment-level API key**, gets signed links
back, and redirects the browser into the room. Nothing is embedded, nothing
per organization is connected, and the only secret that ever leaves this app
is the API key. The key and the webhook secret live in the **`settings`
table** and are pasted in on the admin settings page — not in the
environment — so connecting is the same flow on every Gateling system and
needs no redeploy.

```text
teacher clicks "Start class"
  └─ tRPC sessions.startMeeting ──POST /api/v1/meetings──▶ meetings.gateling.com
                                  (host = the teacher, externalRef = session:<id>)
  └─ browser opens /live-classes/sessions/<id>/join
       └─ route handler ──POST …/join-links (role: host)──▶  { url: /sso/join?token=… }
       └─ 302 → that url ────────────────────────────────▶ in the room, as host, no login

student clicks "Join" → same route, role: participant (name filled in, no waiting room)
staff clicks "Copy link" → the plain guestUrl, for students without an account

room closes ──POST /api/meetings-webhook (signed)──▶ Inngest ──▶ session → completed
```

## 1. Setup — once per deployment, by an admin

1. Open this app's **Integrations** page (`/settings`, sidebar → General). The
   Gateling Meetings card shows the two values Meetings will ask for: this
   deployment's **webhook URL** (`<origin>/api/meetings-webhook`) and its
   **return origin**.
2. On `https://meetings.gateling.com/settings/integrations` (an account listed
   in Meetings' `ADMIN_EMAILS`), click **New integration**:

   | Field | Value |
   |---|---|
   | Name | Gateling-TMS — shown as "Back to Gateling-TMS" after a meeting |
   | Slug | `gateling-tms` |
   | Webhook URL | the webhook URL from step 1 |
   | Allowed return origins | the origin from step 1 |

3. Copy the **API key** (`gm_live_…`) and the **webhook secret** (`whsec_…`)
   back into the two fields on the Integrations page and save each. Live
   classes are on for every academy as soon as the key is saved; the secret is
   what lets a closing room mark its session completed.

They are shown once on Meetings; **Rotate key** issues a fresh pair — paste
both again. **Clear** on either field disconnects.

One integration per environment: a preview deployment gets its own
integration with its own webhook URL and return origin, never production's
key.

## 2. Where the values live

The `settings` table (`src/drizzle/schemas/system/settings-table.ts`, migration
`0023`) — the same table every Gateling system carries — keyed by the codes in
`features/system/settings/lib/system-settings-registry.ts`:

| Code | Setting | Secret |
|---|---|---|
| `00001` | Meetings API URL (defaults to `https://meetings.gateling.com`; `http` only for localhost) | no |
| `00002` | Meetings API key | yes |
| `00003` | Meetings webhook secret | yes |

The rows are created by the data migration `0024_seed_system_settings.sql`
(a `drizzle-kit generate --custom` file) — deployment data always ships as
a migration, never as a runtime insert or a seed script. Secrets
are never returned to a browser: `settings.list` reports only whether one is
set, and saving replaces it. The page and both procedures are
`orgAdminProcedure` — organization admins own this, there is no separate
operator role (STATE.md D42).

`resolveMeetingsClient` / `isLiveClassesEnabled` / `resolveMeetingsWebhookSecret`
(`sessions/server/meetings-config.ts`) read the rows per call — one indexed
lookup — so a rotated key takes effect on the next click, not after a restart.
Unset, classes schedule normally, the agenda says live classes aren't set up,
and "Start class" is not offered.

**There are no `MEETINGS_*` environment variables**, and nothing per
organization. The onMeeting-era "Meeting rooms" page, its `meeting_accounts`
table and its `ONMEETING_CREDENTIALS_ENCRYPTION_KEY` were removed with the
switch (migrations `0021`/`0022`).

## 3. The client

The client, the scheduling helpers and the signed-webhook receiver are the
`@gateling/meetings-integration` registry block — the same files every
Gateling system installs. **Do not edit `src/integrations/meetings/*` here**;
change the block in `gateling-registry`, bump its version, and re-run

```bash
npx shadcn@latest add @gateling/meetings-integration --overwrite
```

(then re-apply `onDelivery` in `src/app/api/meetings-webhook/route.ts`, which
is a starter this app owns). The block's own specs run with `npm test`
(`vitest.config.ts` includes them) — they are the contract tests for an API
this app doesn't own.

The block's own `getMeetingsClient()` reads the environment and is not
used here — `meetings-config.ts` builds the client from the settings rows
with the block's `createMeetingsClient` instead. Every response URL is
checked to be `https` at the boundary; provider error text never reaches a
member (`translateMeetingsError` in `sessions/server/meetings.ts` maps a
status onto this app's own copy).

## 4. Sessions and meetings

Meetings are created **on demand**, when a host presses "Start class"
(STATE.md D143) — not generated ahead of schedule — so group regeneration and
deletion still tell the provider nothing. The flow, in
`sessions/server/meetings.ts`:

- **Who may start:** the assigned teacher, or an org admin (`canHostSession`),
  inside the meeting window (15 min before → 30 min after the class was due
  to end).
- **Who hosts:** the assigned teacher — even when an admin presses Start for
  them — or the admin when no teacher is assigned. Meetings binds host rights
  to that one `externalId`, so it is recorded on the row as
  `meetingHostUserId`; reassigning the teacher afterwards does not demote the
  person running the room. An admin who didn't start the class joins it as a
  participant.
- **Idempotent:** the create carries `Idempotency-Key: session:<id>:meeting`,
  so two hosts pressing Start at once get one meeting from Meetings; the row
  write is a compare-and-set on `meetingCode IS NULL`. No advisory lock is
  needed any more — there is no room capacity to reserve.
- **Stored:** `meetingCode`, `joinUrl` (the plain `guestUrl`, safe to share),
  `meetingHostUserId`. **Not stored:** any host link — they are single-use and
  expire in minutes.
- **Settings:** `waitingRoom: false`, `allowGuests: true` — a class of thirty
  can't be admitted one by one, and the share link has to work from WhatsApp.
- **Identity:** `externalId` is this app's user id, so a teacher working for
  two academies is one linked account on Meetings.

### Joining

`GET /live-classes/sessions/[id]/join` is a route handler that invokes
`sessions.joinLink` through the server-side tRPC caller and 302s to the
signed URL it gets back. A plain `<a href>` is all the UI needs; membership,
the student-only-own-classes rule, and the host rule are all applied by the
procedure. Failures land back on the agenda as `?joinResult=<code>` — a fixed
code from `sessions/lib/join-result.ts`, never text (STATE.md D47).

`returnUrl` ("Back to Gateling-TMS") is sent only when `BASE_URL` is an
`https` origin: Meetings refuses one outside the integration's allowed
origins, and a laptop's localhost is never on that list — so make sure the
deployment's origin is in **Allowed return origins** (§1), or joining fails
with "misconfigured".

## 5. Webhooks

`POST /api/meetings-webhook` verifies the `X-Meetings-Signature` (HMAC-SHA256
over `<t>.<raw body>`, five-minute replay window, 64 KB cap) and handles two
events **inline** (`attendance/server/meetings-webhook.ts`), not through
Inngest — the Inngest app has never synced in production, where a queued
event is accepted and silently never run (STATE.md D178, D181). Every write is
idempotent, so Meetings' retries (on a 500 or its 10-second timeout) only
repeat no-ops:

- `meeting.ended` moves the session `ongoing → completed` — a compare-and-set
  on both the status and the meeting code, so a stale delivery leaves the row
  alone — then settles the register from the participant log (below).
- `participant.joined` (non-host only) marks a matched student present.

`meeting.started` and `participant.left` are acknowledged and dropped.

The secret is read from the settings table per delivery. Without one the
endpoint answers a bare 503, so Meetings keeps retrying instead of dropping
the event — and the Integrations page warns that classes will start but not
be marked completed.

### Automatic attendance, by name (STATE.md D180)

Guests carry no `externalId`, so the only identity a join has is the name the
student typed (or their account name, on a signed-in join link). A join counts
**only** when that name — normalized for case, spacing, punctuation, harakat
and the Arabic letter variants people swap (أ/إ/آ, ى/ي, ة/ه) — equals exactly
one roster trainee's name or linked account name. The pure rules live in
`attendance/lib/meeting-attendance.ts`, the writes in
`attendance/server/meeting-sync.ts`.

- **On join:** the trainee is marked present (`source: "meetings"`) with
  `joinedAt` and `lateMinutes` (whole minutes after `scheduledAt`). A rejoin
  keeps the earliest arrival.
- **On room close:** `GET /meetings/:code/participants` is read and every
  matched trainee's `joinedAt`, `leftAt` and `attendedMinutes` are settled
  (overlapping connections merged). This also catches joins whose webhook was
  lost.
- **Never:** overwriting a teacher's `manual` verdict or lateness (timings
  still fill in), marking an unmatched trainee absent, or matching an
  ambiguous or partial name. Those rows stay for the teacher.

## 6. Local testing

There is no sandbox, but Meetings runs locally. In `G:\apps\gateling-meetings`:

```bash
npm run db:start && npm run livekit && npm run inngest && npm run dev
```

Create an integration at `http://localhost:3000/settings/integrations` (its
port), set its webhook URL to this app's `/api/meetings-webhook` (adjust
ports), then on this app's `/settings` page set the Meetings API URL to the
local instance (`http://localhost:…` is accepted for localhost only) and
paste the key and secret. Start a class from the agenda; end it from the
room; the session flips to `completed`.

The unit suite covers the pure parts (`tests/session-meetings.test.ts`) and
the block's own client/webhook specs. `e2e/journey/meetings-fixture-session.spec.ts`
checks the two join states from seeded fixture data without contacting
Meetings at all (`docs/seeding-and-demo-data.md`).

## Not in scope

Pre-creating rooms when a schedule is saved (so the link exists days ahead);
automatic attendance; recordings (Meetings has none); per-organization
Meetings accounts; embedding the room (Meetings' CSP forbids it on purpose).
