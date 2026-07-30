# Google integration

How Gateling-TMS connects to Google, what has to be configured before the
Google Forms import works, and where the moving parts live. Written while
building Phase 7 segment ③.

Google is **optional**. An organization that never connects it still builds
assessments by hand in the Phase 4 builder — the import is a migration path
for academies whose quizzes already live in Google Forms. Nothing in the app
fails when the credentials are absent; `/assessments/google` says so instead.

There are **two separate Google grants** in this app, and they must not be
confused:

| | Sign-in (Phase 2) | Forms import (Phase 7) |
|---|---|---|
| Who authorizes | an individual user | an organization's admin |
| What it proves | "this is my Google account" | "this org may read this account's forms" |
| Redirect URI | `/api/oauth/google` | `/api/google/callback` |
| Scopes | `openid email profile` | `openid email` + `forms.body.readonly` |
| Stored in | `user_oauth_accounts` (no credentials — see below) | `google_integrations` (encrypted tokens) |

They share the same Google Cloud project and the same OAuth client, so the
only setup work is adding a redirect URI and a scope to what already exists.

## 1. Google Cloud setup (one per deployment, done once)

1. Open the **existing** project used for Google sign-in →
   **APIs & Services**.
2. **Enable the Google Forms API** (*Library → "Google Forms API" → Enable*).
   Without this, `forms.get` answers 403 even with a valid token.
3. **Credentials → the OAuth 2.0 Client ID already used for sign-in →
   Authorized redirect URIs** — add one per environment, exactly matching
   `BASE_URL` + `/api/google/callback`:
   - production: `https://tms.gateling.com/api/google/callback`
   - preview: the Vercel preview origin + `/api/google/callback`
   - local: `http://localhost:3000/api/google/callback`

   Google compares the redirect URI byte-for-byte — a trailing slash mismatch
   fails the exchange.
4. **OAuth consent screen → Data access** — add the scope
   `https://www.googleapis.com/auth/forms.body.readonly`.

   This is a **sensitive** scope. While the app is in *Testing*, only listed
   test users can complete the grant. Publishing it to *In production* with
   this scope requires Google's verification review (app homepage, privacy
   policy, a demo video of the consent flow) — both `/privacy` and the
   marketing site already exist for that.

### Why there is no Drive scope

Listing an account's forms ("show me my forms and let me pick one") requires
`drive.metadata.readonly`, which Google classifies as **restricted** — that
adds an annual third-party security assessment (CASA) on top of ordinary
verification. The import takes a pasted form link instead, which needs only
the sensitive Forms scope above. Recorded as STATE.md **D123**; revisit only
if the restricted-scope process is ever worth starting.

## 2. Environment variables

| Variable | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID` | Cloud console → Credentials (same value sign-in uses) |
| `GOOGLE_CLIENT_SECRET` | Cloud console → Credentials (same value sign-in uses) |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Generated locally: `openssl rand -base64 32` |

All three are optional in `src/data/env/server.ts` — the app boots without
them (unlike the Inngest keys, which fail closed, because a missing Google
credential leaves a feature unavailable rather than an endpoint unprotected).

`GOOGLE_TOKEN_ENCRYPTION_KEY` must be **32 bytes, base64-encoded**, and must
differ per environment. It is deliberately *not* the same value as
`ZOOM_TOKEN_ENCRYPTION_KEY`, so rotating one provider's key never touches the
other's stored tokens. Rotating it doesn't corrupt anything: stored tokens
stop decrypting, the affected connection reports an error, and each
organization reconnects once.

## 3. Connect flow

One grant per organization — `google_integrations` has a unique index on
`organizationId`, and reconnecting upserts that row.

```
/assessments/google  ──"Connect Google"──▶  GET /api/google/connect
                                              │ admin check
                                              │ sets googleConnectState cookie
                                              ▼
                                     accounts.google.com consent
                                              │
                                              ▼
                                     GET /api/google/callback
                                       │ state cookie matches?
                                       │ session still an org admin?
                                       │ exchange code → tokens
                                       │ refresh token present? scope granted?
                                       │ encrypt + upsert row
                                       ▼
                          /assessments/google?googleResult=<code>
```

Both route handlers exist because a tRPC mutation cannot set a cookie on a
redirect that leaves the app. Everything a procedure would enforce is
re-applied by hand: session, active organization, admin role. The state cookie
and the session check are independent on purpose — the cookie proves *this
browser* started the handshake, the session proves *this person* may bind an
account to *this org*.

Only fixed result codes travel in the URL
(`google-import/lib/redirect-codes.ts`); raw Google or database error text
never does. Two codes are worth calling out because each has a specific fix:

- `no_refresh_token` — Google mints a refresh token only on a fresh consent.
  The authorize URL sends `access_type=offline&prompt=consent` precisely to
  force one, so this should not normally happen; if it does, the admin removes
  Gateling from <https://myaccount.google.com/permissions> and connects again.
  The connection is **refused**, not stored: without a refresh token the grant
  would look healthy and stop working within the hour.
- `missing_scope` — Google's consent screen lets a user untick individual
  permissions. A grant without the Forms scope is refused for the same reason.

## 4. Tokens

- `accessToken`/`refreshToken` hold AES-256-GCM ciphertext
  (`integrations/oauth/token-crypto.ts`, shared with Zoom). Nothing outside
  `google-import/server/` ever selects those columns — the query layer's
  column list can't leak them by accident.
- `getValidGoogleAccessToken(organizationId)` is the only way the rest of the
  app gets a usable token. It refreshes a minute before expiry.
- **No advisory lock**, unlike Zoom's equivalent. Zoom rotates the refresh
  token on every refresh and invalidates the previous one, which makes
  concurrent refreshes destructive; Google keeps the refresh token stable and
  returns no new one, so two simultaneous refreshes both succeed and the last
  write simply wins.
- A refused refresh marks the row `status: "error"` with the reason, so
  `/assessments/google` tells the admins to reconnect instead of the import
  failing with no explanation anywhere.
- Disconnecting deletes the row immediately and offloads the revoke
  (`https://oauth2.googleapis.com/revoke`) to the
  `google-integration/disconnected` Inngest function — an external round trip
  the admin shouldn't wait on, and one worth retrying.

### Sign-in stores no Google credentials

`user_oauth_accounts` used to carry `accessToken`/`refreshToken`/`expiresAt`/
`scopes` columns that no code path ever wrote. They were dropped in migration
`0015` rather than encrypted (STATE.md D124): the sign-in callback only needs
the provider account id to recognize a returning user, and unpopulated
credential storage is a trap for a future writer rather than a safeguard.

## 5. Local testing

The connect flow needs a real Google account and a real OAuth client, so it
cannot be exercised offline. What *can* be checked without credentials:

- With the env vars unset, `/assessments/google` reports "not configured" and
  offers no button that could only fail.
- `/api/google/connect` redirects to `?googleResult=not_configured` instead of
  building an authorize URL with empty credentials.
- A non-admin member of the org gets `?googleResult=forbidden` from both
  routes.
