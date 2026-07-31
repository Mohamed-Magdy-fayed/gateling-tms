# Demo-readiness checklist

`docs/rebuild/phases/phase-08.md` step 7, and the launch gate's
**landing-truth final walk**: every claim a visitor can read must be
demonstrable on the `demo` seed profile, in both languages, on a phone-sized
viewport for the core flows.

Walked by a human, not by the agent (`06-workflow.md` §6). Record the outcome
and the date in `docs/rebuild/STATE.md`.

## Setup

```bash
docker compose up -d
npm run db:seed:demo
npm run dev
```

Sign in as `admin@gateling-tms.dev` / `DevPass123!` (org: *Gateling-TMS Dev
Academy*). Teacher and student accounts share the same password —
see README.md.

---

## A. Landing-truth walk

Every free-plan claim, and where it is demonstrated. A claim with no working
path is a launch blocker, not a documentation gap.

### Home page (`/`)

| Claim | Demo path | ☐ |
|---|---|---|
| "Free — no credit card" | `/pricing`: the Free tier is the only enabled CTA; nothing asks for payment anywhere in signup. | ☐ |
| "Bilingual — English & Arabic" | Switch language in the header; the whole page including the footer is Arabic and `dir="rtl"`. | ☐ |
| Showcase band ("N+ academies…") | Renders from real consented organizations. The demo org has consented, so the band is present. **The figure is 5× the real count — a known, recorded overstatement (STATE.md D153), not a bug.** | ☐ |
| Testimonial section | Shows the seeded, approved quote. Un-approve it in `db:studio` and the section disappears — nothing invented is ever shown. | ☐ |
| Feature preview grid | Three free modules link to real pages; six premium ones read "coming soon" and are not links. | ☐ |

### Features (`/features`)

| Claim | Demo path | ☐ |
|---|---|---|
| Content Library — resource storage, media files, organization, search | `/content-library/courses` → *English Foundations* → levels, lectures, an uploaded thumbnail, and the search box on the courses table. | ☐ |
| Learning Flow — course structure, progress, assessments, certificates | `/learning-flow/groups` → *Beginner Batch A*; `/learning-flow/trainees/<id>` → progress; `/assessments` → the seeded quiz; `/learning-flow/certificates` → issued certificates. | ☐ |
| "Built-in Assessments (or imported from Google Forms)" | `/assessments` builder for built-in. Google import at `/assessments/google` — **reports "not configured" without the Google Cloud setup**; either complete that setup before demoing, or say so out loud. | ☐ |
| Live Classes — HD video, whiteboard, recording, screen sharing | These are onMeeting's features, delivered by the room the class opens in. `/live-classes/sessions` shows the schedule and the seeded fixture session's host link. **Demonstrating the room itself needs a real onMeeting account — there is no sandbox.** | ☐ |
| Six premium modules marked "coming soon" | `/features`: each premium card carries the badge and no CTA. | ☐ |

### Pricing (`/pricing`)

| Claim | Demo path | ☐ |
|---|---|---|
| Free: 50 students, 5 courses, 1 GB | `/organizations` → plan card and usage meters show the real counts against those caps. | ☐ |
| Paid tiers exist but are not purchasable | Only the Free CTA is enabled; the others are inert. | ☐ |
| Free plan has no time limit | Nothing in the app mentions a trial or an expiry. | ☐ |

### Legal

| Claim | Demo path | ☐ |
|---|---|---|
| Privacy policy describes what's published | `/privacy` → "What we publish on our website, and only with your permission" matches what `/organizations` → *Public showcase* actually controls. | ☐ |
| Every footer link resolves | Covered automatically by `e2e/home.spec.ts`'s dead-link check; spot-check the footer anyway. | ☐ |

---

## B. The product-spec journey

`00-product-spec.md`'s acceptance script, steps 1–11. Automated end to end in
`e2e/journey/full-journey.spec.ts`, so this is a confirmation walk rather than a
discovery one — do it on a **fresh signup**, not the demo org, because the
zero-master-data promise is about an empty org.

| Step | ☐ |
|---|---|
| 1–2. Landing → *Get Started Free* → the two-step wizard | ☐ |
| 3. Verify email → optional passkey → dashboard | ☐ |
| 4. Organization exists, you are its admin | ☐ |
| 5. **Create a class with no course, no level and no master data first** | ☐ |
| 6. Import students from the downloaded template, with two invalid rows reported and the rest committed | ☐ |
| 7. Assign students to the group | ☐ |
| 8. Sessions generated from the weekly schedule | ☐ |
| 9. Build a quiz (or import a Google Form) and take it | ☐ |
| 10. Placement test → review → assigned level | ☐ |
| 11. Progress → complete → certificate; then hit a free-plan limit and read the message | ☐ |

---

## C. Both languages

| Check | ☐ |
|---|---|
| `/`, `/features`, `/pricing`, `/testimonials`, `/contact`, `/privacy` in Arabic | ☐ |
| `/dashboard`, `/learning-flow/groups`, `/content-library/courses`, `/assessments`, `/organizations` in Arabic | ☐ |
| `dir="rtl"` and no clipped or mirrored-wrong layout (logical properties only) | ☐ |
| No English string left in an Arabic screen (a missing key fails `npm test` via `tests/i18n-parity.test.ts`, so this is a visual check for awkward wording, not for gaps) | ☐ |

## D. Mobile viewport

At 375px wide, on a real device or devtools:

| Screen | ☐ |
|---|---|
| `/` — hero, showcase band, testimonial card | ☐ |
| `/pricing` — four tiers stack, no horizontal scroll | ☐ |
| `/dashboard` — sidebar collapses to the sheet, stat cards stack | ☐ |
| `/learning-flow/trainees` — the data table scrolls inside itself, page does not | ☐ |
| One form dialog (add a trainee) — body scrolls, header and footer stay pinned | ☐ |

## E. Automated gate

All of these green on the commit being demoed:

| Command | ☐ |
|---|---|
| `npm run check` | ☐ |
| `npm test` | ☐ |
| `npm run test:isolation` | ☐ |
| `npm run build` | ☐ |
| `npm run audit:gate` → 0 vulnerabilities | ☐ |
| `npm run scan:secrets` | ☐ |
| `npm run test:e2e` | ☐ |

## F. Known gaps to say out loud when demoing

Not blockers, but do not let them be discovered mid-demo:

- **Live Classes needs a real onMeeting account.** The seeded session's links
  are fixtures; joining an actual room is not demoable without one.
- **Google Forms import needs the Cloud setup** in `docs/integrations-google.md`
  (§1–§2) and a listed test user while the consent screen is in Testing mode.
- **AI short-answer grading needs `GEMINI_API_KEY`.** Without it, grading still
  settles exact and normalised matches and routes the rest to the manual-grade
  dialog.
- **Certificates print from the browser**; there is no generated PDF file yet
  (STATE.md D89).
- **The hero academy figure is inflated 5×** (D153).
