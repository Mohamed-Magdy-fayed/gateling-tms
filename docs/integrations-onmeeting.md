# onMeeting integration

> **Status: specification, not yet shipped.** This file lands with the docs
> re-point that precedes the code. Until the Phase 6 rebuild segments merge,
> the app still runs the direct Zoom integration described in
> `docs/integrations-zoom.md` (now marked superseded). Everything below is what
> is being built, and is the contract those segments are written against.

Live Classes runs on **onMeeting** (`https://onmeeting.co`), an Egyptian
meeting platform built on top of Zoom. It replaced the direct Zoom integration
in Phase 6 — see `docs/rebuild/STATE.md` D142 for why.

The short version of the difference: onMeeting has **no OAuth app, no
marketplace registration, and no webhook secret**. An organization admin signs
in once with their own onMeeting email and password, and the platform hands
back long-lived API keys. That is the whole setup — there is nothing for
Mohamed to provision per deployment.

> **Source of truth for the API.** onmeeting.co publishes no developer
> documentation. Every endpoint below is taken from the legacy app's working
> client (`SOURCE/src/lib/zoom/onmeeting.ts`), which ran against this API in
> production. Where behaviour is unverified it is called out as such — see
> §7. Treat this file as the spec until onMeeting publishes one.

## 1. Setup

Nothing per deployment except one environment variable (§2). Each
organization needs its own onMeeting account with at least one **room**;
rooms are what meetings are created in, and they are what the org pays for.

## 2. Environment variables

| Variable | Where it comes from |
|---|---|
| `ONMEETING_CREDENTIALS_ENCRYPTION_KEY` | Generated locally: `openssl rand -base64 32` |

Optional in `src/data/env/server.ts` — the app boots without it (a missing
credential leaves a feature unavailable rather than an endpoint unprotected,
the same rule the other integrations follow). It must be **32 bytes,
base64-encoded**, and must differ per environment.

Rotating it doesn't corrupt anything: stored API keys stop decrypting, the
affected accounts report an error, and each organization reconnects once.

There is deliberately **no** `ONMEETING_API_KEY` at deployment level. Keys are
per organization, obtained through the connect flow below, and never shared.

## 3. The API

Base URL `https://onmeeting.co/v2`. Successful responses wrap the payload as
`{ results: { data: ... } }`; failures carry an `errorMessage`.

| Call | Purpose |
|---|---|
| `POST /user/api-keys` | `{email, password}` → `{api_key, api_secret, account_id}` |
| `POST /auth/token` | `{api_key, api_secret}` → `{token}`, the bearer for everything else |
| `GET /user/rooms` | the account's rooms — `room_code`, `room_name`, capacity, subscription end, status |
| `POST /meeting` | `{topic, room_code, join_before_host, recording, alert}` → `{id, meeting_no, ...}` |
| `GET /meeting/{meeting_no}` | → `{join_url, start_url}` — **both stored exactly as returned** |
| `GET /user/meetings` | rooms with their meetings — not used by this app |

Every response is **Zod-parsed** on the way in (`src/integrations/onmeeting/`).
The legacy client cast responses with `as T` and trusted them; a third-party
shape change would have surfaced as an unexplained crash deep in a mutation.

Provider errors are never forwarded to the client verbatim and never logged
raw — same rule as Gemini (D138) and Google.

**The provider's `join_url` is authoritative.** `GET /meeting/{meeting_no}`
returns both URLs and both are persisted as returned. The
`https://onmeeting.co/j/{meeting_no}` form — which the legacy client built by
hand for its meeting list — exists here only as a **fallback for the create
response**, which carries a meeting number but no URLs. If onMeeting ever
changes that link shape, a stored `join_url` keeps working where a constructed
one would not.

## 4. Connect flow

```text
admin opens "Connect onMeeting account"
  └─ enters a display name + their onMeeting email + password
  └─ tRPC meetingAccounts.connect   POST /user/api-keys   (the only call the
                                                           password is used for)
                                    POST /auth/token
                                    GET  /user/rooms
  └─ one `meeting_accounts` row per room, status `active`
```

- The **password is never persisted and never logged.** It is used for exactly
  one request and then dropped. Only `api_key` / `api_secret` are stored, and
  those are AES-256-GCM ciphertext (§6).
- Because there is no OAuth redirect, there is no state cookie, no callback
  route, and no pending row — the account is either connected or it isn't.
  This is why the Zoom connect flow's `/api/zoom/connect` + `/api/zoom/callback`
  pair has no equivalent here.
- The mutation is `orgAdminProcedure` **and** rate-limited: it accepts a
  password, so it gets the same treatment as the auth endpoints
  (`src/integrations/ratelimit.ts`).
- **One row per room, not one row per account.** A room hosts one live meeting
  at a time (§5), so rooms are the real unit of capacity — an org running three
  concurrent classes needs three rooms, and the session scheduler picks between
  them exactly as the Zoom version picked between connected accounts.
- **A room's identity is `(organizationId, roomCode)`, enforced in the
  database** by a partial unique index over rows that aren't soft-deleted. This
  is what makes reconnecting safe: connecting the same onMeeting account twice
  — a retry, a rotated password, a second admin doing it — **updates the
  existing row** (fresh credentials, current room name, back to `active`, error
  cleared) instead of inserting a duplicate that would double the apparent
  capacity and leave half the sessions pointing at stale keys. The index is
  partial so a disconnected room can be reconnected later without colliding
  with its own tombstone.
- **A room that disappears from `/user/rooms` is left alone, not deleted.**
  Sessions reference rooms, and the app can't tell "this room was cancelled"
  from "this response was incomplete". Reconnecting refreshes what it sees; it
  never retires what it doesn't.
- **Credentials that stop decrypting** (a rotated
  `ONMEETING_CREDENTIALS_ENCRYPTION_KEY`) surface as a failed call, which moves
  that room to `status: "error"` with the reason. Reconnecting is the fix, and
  because reconnect is an update keyed on the room, it repairs the same row
  rather than leaving a broken one beside a working one.

## 5. Sessions and meetings

`POST /meeting` takes a topic and a room. **It has no `start_time`** — a
meeting lives in a room, it is not booked for a moment in time. So meetings
are created **on demand**, not pre-generated:

```text
teacher (or admin) opens the session inside its meeting window
  └─ clicks "Start class"
  └─ tRPC sessions.startMeeting
       ├─ session already has a meeting?  return its stored links
       └─ otherwise: reserve a free room under an advisory lock,
                     POST /meeting, then GET /meeting/{meeting_no},
                     store meetingNumber / joinUrl / startUrl
```

- **A room hosts one live meeting at a time.** The legacy client surfaced this
  as `"Another meeting may be ongoing now on this zoom room!"`. Room selection
  therefore runs under the same per-organization advisory lock the Zoom
  implementation used for account selection — two jobs provisioning two
  overlapping sessions must not both decide the same room is free.
- **`start_url` grants host rights to whoever opens it**, so it is only ever
  returned to the session's assigned teacher or an org admin
  (`sessions/lib/session-links.ts`, unchanged from the Zoom version).
- A session whose org has connected no account stays **offline** and still
  schedules and displays normally. Live classes are optional, never a blocker.
- Before "Start class" is pressed the session simply has no meeting yet, and
  everyone else sees a "class hasn't started" state rather than a dead link.

## 6. Credentials

- `api_key` / `api_secret` are stored **AES-256-GCM encrypted**
  (`src/integrations/oauth/token-crypto.ts`, shared with the Google grant); the
  plaintext never reaches the database and no tRPC route selects those columns.
- The bearer token from `POST /auth/token` is short-lived and is **not**
  persisted — it is fetched per operation.
- Disconnecting soft-deletes the row and clears the key columns immediately.
  There is no remote revoke endpoint, so the keys stay valid on onMeeting's
  side; an admin who wants them dead must rotate them in onMeeting.

## 7. Attendance, recordings, and other open questions

**Attendance is marked by the teacher, not detected.** onMeeting exposes no
webhooks and no participant/report endpoint that we know of, so there is
nothing to derive attendance from. `markAttendance` stamps `source: "manual"`
and the session page is where the register is taken. In-app copy and the
landing pages say so — no claim of automatic attendance survives anywhere
(blueprint rule 9).

**Recordings are not surfaced.** `POST /meeting` accepts a `recording` flag,
but no documented endpoint returns a recording afterwards, so the app stores no
recording link. The Zoom-era `zoomRecordingUrl` / `zoomRecordingPassword`
columns were dropped rather than left permanently null.

Questions worth putting to `support@onmeeting.co`, any of which would let us
restore functionality:

1. Are there **webhooks** (meeting started/ended, participant joined/left)? If
   so, automatic attendance comes straight back.
2. Is there a **participants or report endpoint** per meeting? A poll after
   class ends would be a workable second-best.
3. Is there a **recordings** endpoint?
4. What is the **TTL** of the `/auth/token` bearer, and are there rate limits
   worth respecting?
5. Do the API keys from `/user/api-keys` expire or rotate?

## 8. Local testing

There is no sandbox. The integration is unit-tested against fixtures derived
from the legacy client's observed response shapes, which is what CI runs. The
live walk needs a real onMeeting account with at least one room and is part of
Phase 6's verification gate — see `docs/rebuild/phases/phase-06.md`.
