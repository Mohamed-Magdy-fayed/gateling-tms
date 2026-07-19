# Phase 3 — Landing Pages

**Goal:** truthful, bilingual marketing site: home, features, pricing, get-started (built in Phase 2), legal pages — Gateling-TMS branded, free tier accurate, paid modules "coming soon".
**Prerequisites:** Phase 2 gate (get-started must actually work before marketing points at it). **Reference docs:** `00-product-spec.md` (the promise mapping is binding), `05-roadmap.md`.

SOURCE root for structure/copy mining: `C:\Users\moham\OneDrive\Desktop\gateling-tms\src\app\(landing-pages)\`.

## Steps

1. **Layout & chrome.** Adapt SOURCE `_layout\{header,footer}.tsx` + `_shared\` (logo, background) into `app\(landing)\`. Header CTA → get-started; locale switcher; no dead links.
2. **Home.** Rebuild SOURCE sections (`_components\hero-section`, `value-proposition-section`, `features-preview-section`, `process-section`, `final-cta-section`) with rewritten copy:
   - Hero: "Your gateway to manage your online teaching business" positioning stays; **drop fabricated trust stats** ("50+ Active Academies", "Trusted by 500+ businesses", satisfaction %s) until real numbers exist.
   - Feature preview: 9 modules shown, but the 6 paid ones visibly badged "coming soon"; 3 free ones link to features page.
   - Process section: rewrite from agency language ("2–4 weeks delivery", consultation) to **self-serve**: Sign up → Set up your academy → Add classes & students → Teach. That's the product now.
   - CTA: "Get Started Free" → get-started.
3. **Features page.** Rebuild from SOURCE `features\` with the free/premium split preserved: Free = Content Library, Learning Flow, Live Classes with their **verbatim bullets** (they're all true per `00-product-spec.md` mapping); Live Classes description adds **"powered by Zoom"**. Premium = the 6 modules with verbatim bullets + "coming soon" badges (no availability claims).
4. **Pricing page.** Keep SOURCE `pricing\data.ts` values (copy file as the single pricing source, also consumed by limit UIs). All 4 tiers rendered; Free = working signup CTA; paid = "coming soon" + disabled/notify-me CTA (notify-me may just mailto/contact for v1 — no subscriber infra required). Keep "free has no time limit" copy; **remove/park the 30-day money-back + Paymob payment-methods copy** until billing exists (roadmap #7).
5. **Contact + legal.** Adapt SOURCE `about\ contact\ privacy\ terms\ refund\ cookies\`. Contact form → tRPC mutation → Inngest → email to Gateling inbox; **decide** stored `messages` table or email-only and record in STATE.md (03-data-model open item). Refund page must match reality (no paid plans yet — simplify to policy-on-launch note or drop from nav until billing).
6. **Translations.** Every page: `-en.ts` + `-ar.ts` complete pairs re-keyed to the B i18n engine. Mine SOURCE `_translations\` for reusable AR copy, but audit each string against the new truthful EN.
7. **SEO basics.** Metadata per page, OG tags, sitemap, robots — B repo has an SEO blueprint (`G:\apps\gateling.com\docs\seo-blueprint.md`) as reference; keep it light for v1.
8. **e2e.** Playwright: home renders EN/AR (RTL layout sanity), pricing shows 4 tiers with exactly one enabled CTA, features shows coming-soon badges, nav has no 404 links.

## Verification gate

- [ ] Every claim on every landing page maps to a built v1 feature or carries a "coming soon" badge (walk the `00-product-spec.md` table + `05-roadmap.md` ledger literally)
- [ ] Zero occurrences of: "HBS", fabricated stats, agency process language, payment-method claims
- [ ] EN/AR parity — no missing keys (engine should surface/log missing translations)
- [ ] Landing e2e green; `check` + `build` + `audit:gate` green

## Close out

Deliver as segment PRs per `06-workflow.md` (e.g. ① layout + home, ② features + pricing, ③ contact + legal + SEO) — each merged by Mohamed. Then update blueprint `STATE.md` (incl. the messages-table decision); next action → phase-04.
