# 00 — Product Spec

What Gateling-TMS promises and must deliver. The landing pages of SOURCE are the origin of this spec; this file is the distilled, **confirmed** version (Q&A with Mohamed, 2026-07-19). When code and this file disagree, this file wins; when this file is silent, check the SOURCE landing translations referenced below.

## Positioning

**Gateling-TMS** — "Your gateway to manage your online teaching business." A multi-tenant SaaS for online academies and teaching businesses. Anyone can sign up, create their organization (academy), and start managing courses **for free** — no sales call, no setup project. Bilingual EN/AR (RTL) — Egypt-first market, prices in EGP.

Branding: product name **Gateling-TMS**, company **Gateling**. The legacy name "HBS"/"HBS-TMS" (found throughout SOURCE marketing copy and the Inngest app id `hbs-tms`) must not appear anywhere.

Source copy to mine for tone and structure (rewrite, don't copy blindly — it overpromises):
- `C:\Users\moham\OneDrive\Desktop\gateling-tms\src\app\(landing-pages)\_components\_translations\landing-en.ts` (+ `-ar.ts`)
- `...\(landing-pages)\features\_translations\features-en.ts` (+ `-ar.ts`)
- `...\(landing-pages)\pricing\_translations\` and `...\(landing-pages)\pricing\data.ts`
- `...\(landing-pages)\get-started\_translations\get-started-en.ts` (+ `-ar.ts`)

## Personas

- **Owner/Admin** — creates the org, manages everything, invites staff. The person the free tier must win over in the first 10 minutes.
- **Teacher** — runs classes/groups, takes attendance, grades assessments.
- **Student (trainee)** — enrolled by the org; attends sessions, takes quizzes/tests, receives certificates. (Parent accounts exist in SOURCE's model; keep the `parentId` self-reference for later, no parent UI in v1.)

## Plan limits (from SOURCE `pricing\data.ts` — keep these values)

| Plan | Students | Courses | Storage | Price (EGP/mo) | v1 status |
|---|---|---|---|---|---|
| **Free** | 50 | 5 | 1 GB | 0 | **Signup-able, limits enforced** |
| Basic | 200 | 25 | 10 GB | 599.99 | Visible, "coming soon" |
| Professional | 1,000 | 100 | 50 GB | 1,599 | Visible, "coming soon", "popular" badge |
| Enterprise | unlimited | unlimited | 500 GB | 3,999 | Visible, "coming soon" |

Free plan copy: "extended trial with no time limit". Paid CTAs disabled or "notify me". Billing (Paymob) is deferred — see `05-roadmap.md`.

## FREE-tier promise → feature mapping (CONFIRMED — v1 must deliver every row)

Bullets are verbatim from SOURCE `features-en.ts`; every one must be true at launch.

| Module | Promised bullet | Delivered by | Phase |
|---|---|---|---|
| Content Library | Digital Resource Storage | courses → levels → lectures with rich lecture content | 4 |
| Content Library | Media File Management | Firebase Storage uploads, 1 GB/org cap enforced | 4 + 8 |
| Content Library | Content Organization | course/level/lecture hierarchy, org-scoped | 4 |
| Content Library | Advanced Search & Filtering | data-table server-side search/filter/sort on all lists | 1 + 4 |
| Learning Flow | Course Structure Design | level/lecture structure + groups (classes) with schedules | 4–5 |
| Learning Flow | Progress Tracking | enrollment status flow + per-student progress view | 5 |
| Learning Flow | Built-in Assessments | forms system: assignment / quiz / final / placement; built in-app or imported from Google Forms | 4 + 7 |
| Learning Flow | Certificate Generation | certificates on completion | 5 |
| Live Classes | HD Video Streaming | Zoom meetings created/managed by the system | 6 |
| Live Classes | Interactive Whiteboard | Zoom-native; copy says **"powered by Zoom"** | 6 |
| Live Classes | Class Recording | Zoom-native recording; links surfaced on the session | 6 |
| Live Classes | Screen Sharing | Zoom-native | 6 |

Paid modules (HR, Course Store, CRM, Smart Forms, Community, Support) are **not built in v1** — their verbatim promises are preserved in `05-roadmap.md` and shown as "coming soon".

## The end-to-end user journey (acceptance script)

This is the walkthrough that must work at launch, and the script for the Phase 8 Playwright e2e. It is also the definition of "instant onboarding".

1. **Discover** — visitor reads landing page (EN or AR), sees free tier, clicks "Get Started Free".
2. **Sign up** — get-started wizard: business info (contact name, business name, email, phone) → review → submit. (SOURCE wizard: `src\app\(landing-pages)\get-started\`.)
3. **Verify email** — 24 h token link; after verify, optional **passkey setup** (skippable).
4. **Org created** — organization exists on the Free plan; user is its admin; lands on the dashboard.
5. **First class in minutes** *(zero master-data principle)* — from the dashboard the admin can immediately:
   - create a **group** (class) with a weekly schedule — sessions auto-generate (Inngest);
   - add **students** directly — typed one-by-one or **imported from an Excel template** downloaded from the app;
   - **assign** students to the group on the spot.
   No course, level, or any catalog entry is required first. Creating a course later *enriches* groups (levels, curriculum, assessments) but is never a prerequisite.
6. **Teach** — schedule live sessions via connected Zoom account; students get links; attendance is tracked.
7. **Assess** — create a quiz/assignment in the form builder, or **import an existing Google Form** as assignment / quiz / final / placement test; students respond; results tracked.
8. **Placement** — placement tests assign incoming students to appropriate levels.
9. **Progress** — enrollment status flow (placementTest → waiting → ongoing → completed) with per-student view.
10. **Certify** — issue certificates for completions.
11. **Grow** — org hits a free limit (50 students / 5 courses / 1 GB) → friendly limit screen pointing at the coming paid tiers. Never data loss, never a hard wall mid-action.

## Product principles

1. **Instant onboarding** — signup → productive in one sitting; no mandatory setup.
2. **Excel-first** — every major list offers template download + import and export; people migrating from spreadsheets and Google Forms must feel at home (see phase-07).
3. **Truthful marketing** — landing copy only claims what's built; everything else is explicitly "coming soon".
4. **Free means free** — no time limit, no card required; limits are generous enough to run a small academy.
5. **Bilingual parity** — EN and AR are equals; RTL is first-class.
