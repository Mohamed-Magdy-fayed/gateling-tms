# Zoom integration

How Gateling-TMS connects to Zoom, what has to be configured before it works,
and where the moving parts live. Written while building Phase 6 segment ① and
extended by the later segments.

Zoom is **optional**. An organization that never connects it still creates
groups, generates sessions, and runs classes — it just doesn't get meeting
links or automatic attendance. Nothing in the app fails when the credentials
are absent; the connect screen says so instead.

## 1. Zoom Marketplace app (one per deployment, done once)

Gateling-TMS is the OAuth *client*; each organization authorizes its own Zoom
account against that one app.

1. Sign in at <https://marketplace.zoom.us> with the account that should own
   the app → **Develop → Build App → General App**.
2. **Basic Information**
   - App name: `Gateling-TMS`
   - App type: *User-managed app* (each org's admin authorizes their own
     account).
3. **OAuth Information** — add one redirect URL per environment, exactly
   matching `BASE_URL` + `/api/zoom/callback`:
   - production: `https://tms.gateling.com/api/zoom/callback`
   - preview: the Vercel preview origin + `/api/zoom/callback`
   - local: `http://localhost:3000/api/zoom/callback`

   Add the same values to the **OAuth allow list**. Zoom compares the redirect
   URL byte-for-byte — a trailing slash mismatch fails the exchange.
4. **Scopes** — scopes come from this app's configuration, not from the
   authorize URL, so they must be added here:
   - `user:read:user` — identifies which Zoom account authorized
   - `meeting:write:meeting`, `meeting:update:meeting`,
     `meeting:delete:meeting` — creating and maintaining class meetings
     (used from the meeting-linking segment onward)
   - `cloud_recording:read:list_user_recordings` — recording links
     (webhook/attendance segment)
5. **Event Subscriptions** (webhook/attendance segment) — subscribe to
   `meeting.started`, `meeting.ended`, `meeting.participant_joined`,
   `meeting.participant_left`, `recording.completed`, endpoint
   `<origin>/api/webhooks/zoom`. Copy the **Secret Token** into
   `ZOOM_WEBHOOK_SECRET_TOKEN`.

## 2. Environment variables

| Variable | Where it comes from |
|---|---|
| `ZOOM_CLIENT_ID` | Marketplace app → App Credentials |
| `ZOOM_CLIENT_SECRET` | Marketplace app → App Credentials |
| `ZOOM_WEBHOOK_SECRET_TOKEN` | Marketplace app → Event Subscriptions (later segment) |
| `ZOOM_TOKEN_ENCRYPTION_KEY` | Generated locally: `openssl rand -base64 32` |

All four are optional in `src/data/env/server.ts` — the app boots without
them (unlike the Inngest keys, which fail closed, because a missing Zoom
credential leaves a feature unavailable rather than an endpoint unprotected).

`ZOOM_TOKEN_ENCRYPTION_KEY` must be **32 bytes, base64-encoded**, and must
differ per environment. Rotating it doesn't corrupt anything: stored tokens
stop decrypting, the affected connections report an error, and each
organization reconnects once.

## 3. Connect flow

```
admin clicks "Connect Zoom"
  └─ tRPC zoomClients.create        creates a `pending` row, returns its id
  └─ GET /api/zoom/connect/[id]     admin check, sets the state cookie,
                                    redirects to zoom.us/oauth/authorize
  └─ Zoom consent screen
  └─ GET /api/zoom/callback         validates state cookie + session/role,
                                    exchanges the code, stores encrypted
                                    tokens, marks the row `active`
  └─ /live-classes/zoom-clients?zoomResult=connected
```

- The **state** parameter is random; the pending row's id lives in the
  httpOnly cookie next to it, never in the URL. The value Zoom echoes back is
  only ever compared, so a forged state can't aim the handshake at another
  organization's row.
- The **admin role is re-checked in both routes** — a route handler doesn't go
  through `orgProcedure`, so it applies the same rule via
  `resolveOrgAccessFromSession`.
- The token exchange runs **inline** in the callback, which is the one
  deliberate exception to `docs/inngest-offload-policy.md`: the admin is
  waiting on that exact result, and a Zoom authorization code expires in
  seconds, so deferring it would trade a working handshake for a spinner.
  Everything else that talks to Zoom (revoking on disconnect, and from the
  next segment on, creating meetings) goes through Inngest.

## 4. Tokens

- Access and refresh tokens are stored **AES-256-GCM encrypted**
  (`src/integrations/zoom/token-crypto.ts`); the plaintext never reaches the
  database, and no tRPC route selects those columns.
- Zoom **rotates the refresh token on every refresh** and invalidates the
  previous one, so `getValidZoomAccessToken` always writes the new pair back.
  It refreshes a minute before the stated expiry rather than at it, so a token
  can't die mid-request.
- Disconnecting soft-deletes the row, clears the token columns immediately,
  and asks Zoom to revoke the grant from an Inngest job
  (`zoom-client/disconnected`).

## 5. Local testing without a paid Zoom account

A free Zoom account can create and authorize a Marketplace app, so the connect
flow is testable end to end locally. Meeting creation, recording links, and
webhook events need a real (ideally paid) account; the webhook segment's
verification gate allows a fixtures-based pass when none is available — see
`docs/rebuild/phases/phase-06.md`.
