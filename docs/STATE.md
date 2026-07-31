# Gateling-TMS — state

> **This is now the ongoing state doc for the product.** Until the Phase 8
> cut-over it was a stale mirror of the rebuild blueprint's own STATE.md; from
> `v1.0.0` onward, the rebuild history lives in
> [`docs/rebuild/STATE.md`](rebuild/STATE.md) as a record, and day-to-day state
> lives here.

## Status

**v1 is complete.** All eight rebuild phases are built, merged and gated. The
free tier is the whole product: Content Library, Learning Flow and Live Classes,
with Excel and Google Forms import, for up to 50 students, 5 courses and 1 GB of
storage per organization. Paid modules are "coming soon" everywhere they appear.

- **Live:** `tms.gateling.com` (Vercel production, Neon main).
- **Repo:** `Mohamed-Magdy-fayed/gateling-tms`.
- **Deploys:** every merge to `master` builds, migrates and ships. See
  [`deploy.md`](deploy.md).

## What v1 ships

| Area | What works |
|---|---|
| Accounts | Email + password, Google OAuth, passkeys, email verification, password reset, org invitations |
| Organizations | Multi-tenant with `organizationId` on every tenant-owned table, admin/teacher/student roles, plan limits and usage meters |
| Content Library | Courses → levels → lectures, media upload to Firebase, search and CSV/XLSX export |
| Learning Flow | Trainees, groups with weekly schedules, generated sessions, enrollments, placement tests, level progress, certificates |
| Assessments | Form builder, auto-scoring, AI-assisted short-answer grading with manual fallback, Google Forms import |
| Live Classes | onMeeting rooms connected per organization, start-class from a session, teacher-marked attendance |
| Import/export | Template-shaped round trip for students, courses, levels, enrollments and group assignments |
| Marketing site | Home, features, pricing, about, contact, testimonials, and the legal pages — all bilingual |

## Verification

Everything below is green on `master`:

| Gate | Result |
|---|---|
| `npm run check` | typecheck + lint clean |
| `npm test` | unit suite |
| `npm run test:isolation` | org isolation across all 21 tenant-owned tables |
| `npm run build` | production build |
| `npm run audit:gate` | **0 vulnerabilities** |
| `npm run scan:secrets` | no known secret shapes in tracked files |
| `npm run test:e2e` | Playwright, including the full product journey and the enforced-CSP walk |

## Operating it

- **Deploying, env vars, Neon, backups:** [`deploy.md`](deploy.md)
- **Approving a testimonial before it appears publicly:** [`deploy.md`](deploy.md) §5
- **Before a release or a demo:** [`demo-readiness-checklist.md`](demo-readiness-checklist.md)
- **Seed profiles (`baseline` / `demo` / `performance`):** [`seeding-and-demo-data.md`](seeding-and-demo-data.md)

## Known gaps

Carried forward deliberately, each recorded with its reasoning in the rebuild
STATE.md:

- **Certificates print from the browser** — no generated PDF artifact yet; adding
  one is a dependency-policy decision, not an implementation detail (D89).
- **The landing hero's academy figure is 5× the real count** while the label
  still says "academies" — a knowingly-inflated figure, Mohamed's call (D153).
- **No student-facing read path exists.** When one is built it needs queries
  scoped to the caller's own trainee record, and `forms.getTree` must stop
  returning accepted answers before a student can call it.
- **Three integrations report "not configured" until their credentials are set**
  — onMeeting, Google, Gemini. See [`deploy.md`](deploy.md) §2.

## What's next

`docs/rebuild/05-roadmap.md` holds the deferred paid modules; billing is first.
Each front starts with a spec session before any code.
