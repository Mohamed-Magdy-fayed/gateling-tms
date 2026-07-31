# Deploying Gateling-TMS

Operational reference for the three environments (`docs/rebuild/06-workflow.md` §5)
and the launch checklist in `docs/rebuild/phases/phase-08.md` step 6.

This is not a runbook you follow once — it is the list of things that must be
true for a deploy to work, and where to look when one doesn't.

## 1. Environments

| | **dev** | **preview** | **production** |
|---|---|---|---|
| App | `npm run dev` (localhost:3000) | Vercel preview deploy, one per PR | Vercel production → `tms.gateling.com` |
| Postgres | local Docker (`docker compose up -d`) | Neon branch DB per preview | Neon main branch |
| Redis | Upstash dev database | Upstash preview database | Upstash prod database |
| Email | SMTP dev/log transport | real SMTP, test inbox | real SMTP |
| Firebase | dev bucket | dev bucket | prod bucket |
| Inngest | `npm run inngest` (keyless) | Inngest preview keys | Inngest prod keys |
| Google OAuth | dev credentials, localhost redirect | dev credentials, preview redirect | prod credentials |
| onMeeting | per-org, connected in-app | same | same |
| Env vars live in | `.env` (gitignored) | Vercel → **Preview** scope | Vercel → **Production** scope |

**No sharing and no fallbacks across environments.** Encryption keys in
particular are per-environment: `GOOGLE_TOKEN_ENCRYPTION_KEY` and
`ONMEETING_CREDENTIALS_ENCRYPTION_KEY` must each be a *different* 32 random
bytes per environment (`openssl rand -base64 32`), so rotating or leaking one
environment's key never touches another's stored credentials.

## 2. Vercel environment variables

`.env.example` is the canonical list with per-variable notes. What follows is
what each scope must have for a deploy to actually succeed.

### Required — the build fails without these

| Variable | Why |
|---|---|
| `DATABASE_URL` | The build runs `db:migrate` before compiling (§4). |
| `BASE_URL` | Verification/reset emails link here. `src/data/env/server.ts` throws in production if unset, rather than emailing out a localhost link. |
| `OAUTH_REDIRECT_URL_BASE` | Same fail-closed check; a wrong value sends Google's redirect somewhere useless. |
| `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` | Fail-closed in production (STATE.md D40): without them `/api/inngest` would be unauthenticated. Provisioned automatically by the Inngest Vercel integration (D41). |

### Required for a feature to work at all — the build succeeds, the feature reports "not configured"

| Variable | Without it |
|---|---|
| `REDIS_URL`, `REDIS_TOKEN` | No sessions and no rate limiting. Effectively required. |
| `SMTP_*` | `sendMail` logs a warning and no-ops — nobody can verify an email or accept an invite. |
| `FIREBASE_*` | Image upload fails; the nightly storage reconciliation reports a skip rather than failing the run. |
| `ONMEETING_CREDENTIALS_ENCRYPTION_KEY` | No academy can connect an onMeeting account, so no class can be started. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_TOKEN_ENCRYPTION_KEY` | Google sign-in and the Forms import both report not configured. Setup: `docs/integrations-google.md`. |
| `GEMINI_API_KEY` | Short-answer grading still awards exact and normalised matches and sends anything ambiguous to the manual-grade dialog. Nothing errors. Setup: `docs/integrations-gemini.md`. |
| `CONTACT_INBOX_EMAIL` | Contact-form notifications fall back to `SMTP_FROM_EMAIL`/`SMTP_USER`. |

### Outstanding

- [ ] `ONMEETING_CREDENTIALS_ENCRYPTION_KEY` in **both** Preview and Production.
- [ ] Delete the four dead `ZOOM_*` values from the Production scope — the
      integration was removed in Phase 6's onMeeting rebuild (STATE.md D142).

## 3. Neon

- **Production** is the Neon project's `main` branch. `DATABASE_URL` in Vercel's
  Production scope points at it.
- **Preview** uses a Neon branch per preview deploy, branched from the
  production schema, so every PR is exercised against its own migrated database
  and a bad migration is caught before it reaches `main`.
- **Backups:** Neon's point-in-time restore covers the retention window on the
  current plan. Before any migration that drops or rewrites data, take a branch
  from `main` first — a Neon branch is a cheap, instant snapshot and is the
  fastest rollback available. Restoring means branching from a timestamp before
  the change and repointing `DATABASE_URL`.
- Migrations are **never** applied by hand against `main`. The deploy applies
  them; if one fails, fix forward in a PR.

## 4. The deploy itself

1. Mohamed merges a PR into `master`.
2. Vercel builds. Its Build Command runs `npm run db:migrate` **before**
   `next build` (STATE.md D20), so the schema is in place before the app
   compiles against it.
3. A failed migration fails the build, and the previous deployment stays live.
4. Confirm afterward: the deployment reads `READY`, `tms.gateling.com` returns
   200, and Vercel reports no new runtime errors.

### What a failed migration actually leaves behind

Step 3 protects the *app*, not the *database*, and the difference matters.

`drizzle-kit migrate` applies each pending migration in its own transaction, so
a migration that fails rolls itself back. It does **not** roll back the ones
that already succeeded in the same run. A deploy with three pending migrations
that fails on the third leaves the database on migration two while `master` and
the running app are still on the previous release.

Two further exceptions are worth knowing before assuming a rollback happened:

- Statements Postgres refuses to run inside a transaction (`CREATE INDEX
  CONCURRENTLY`, some `ALTER TYPE` sequences) will fail the migration outright
  rather than being rolled back cleanly. Nothing in `0000`–`0019` uses them;
  check before adding one.
- A **data** migration that succeeds structurally but transforms rows wrongly
  commits happily. Nothing here will tell you.

**`READY` and a 200 do not prove the database matches the code.** They prove the
app started. The check is the schema version, not the HTTP status.

### Recovering the database

Do this when a deploy's migrate step failed, or when a migration succeeded and
was wrong.

1. **Establish where the database actually is.** Read the tracking table
   directly — never from a local `.env.*.local`, which is not demonstrably the
   database Vercel deploys against (STATE.md D152):

   ```sql
   select hash, created_at from drizzle.__drizzle_migrations order by created_at;
   ```

   Compare the count against `src/drizzle/migrations/meta/_journal.json`.

2. **If migrations are simply behind and forward is safe** — the usual case, a
   migration that failed for an environmental reason — fix the cause and
   redeploy. The migrate step is idempotent: it applies only what's missing.

3. **If a migration applied and should not have**, restore rather than patch:
   - In Neon, create a branch from `main` at a timestamp **before** the deploy.
     A branch is instant and costs nothing, and it preserves the bad state for
     inspection instead of destroying it.
   - Point `DATABASE_URL` in Vercel's Production scope at the new branch.
   - Redeploy the last known-good commit. Its migrate step is a no-op against a
     database already at that version.
   - Once the app is confirmed healthy, promote the branch or plan the cut-over
     back to `main`.

4. **Verify by schema, not by status code.** Re-run the query from step 1 and
   confirm the count matches the journal for the commit that is now live.

> Take a Neon branch from `main` **before** merging any PR that drops a column,
> rewrites data, or changes a column type. It is the difference between a
> one-minute restore and a reconstruction.

**Preview → production parity.** Before a release, check that the last merged
PR's preview deployment behaved the same as production does after the deploy —
same routes, same migration applied, no config-only differences. A difference
here is almost always a missing variable in one scope.

## 5. Moderating testimonials

Academy owners submit feedback in-app and tick a box to allow publication, but
nothing reaches gateling.com until Gateling approves it. There is no admin
screen for this on purpose — the app has no platform-owner role and inventing
one for a single review action wasn't worth the surface (STATE.md D42's
reasoning).

To review and publish:

```bash
npm run db:studio
```

1. Open the `testimonials` table.
2. Rows awaiting review have `isPublic = true` and `approvedAt = null`.
3. Read the quote. If it should be published, set `approvedAt` to the current
   timestamp. It appears on `/` and `/testimonials` on the next request.
4. To un-publish, clear `approvedAt` again.

Editing a testimonial in the app clears `approvedAt` automatically, so an edited
quote comes back for review rather than staying live.

> Against production, `db:studio` needs the production `DATABASE_URL`. Use
> `.env.production.local` deliberately and close the session afterwards —
> `npm run db:seed:clear` refuses non-local hosts, but Studio does not.

## 6. Release checklist

Run from a clean checkout of `master`:

```bash
npm ci
npm run check
npm test
npm run test:isolation
npm run build
npm run audit:gate
npm run scan:secrets
npm run test:e2e
```

Both `test:isolation` and `test:e2e` need local Docker Postgres running. Only
`test:e2e` needs the demo seed (`npm run db:seed:demo`) — the isolation suite
creates and tears down its own fixture organizations.

Then walk `docs/demo-readiness-checklist.md`.
