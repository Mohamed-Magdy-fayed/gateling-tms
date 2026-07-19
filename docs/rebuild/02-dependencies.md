# 02 — Dependency Policy

The law of the rebuild: only packages below may be installed. `npm audit` must report **0 vulnerabilities** at every phase gate. Adding anything not listed requires: run `npm audit` after install, add a decision row to STATE.md, and update this file.

## Why this exists

SOURCE (`C:\Users\moham\OneDrive\Desktop\gateling-tms`) audits at **13 vulnerabilities (10 moderate, 3 high)** as of 2026-07-19. Every one has a clean resolution — the "not possible for now" ledger at the bottom is empty.

## Banned packages (never install)

| Package | Why banned | Replacement |
|---|---|---|
| `@auth/core`, `@auth/drizzle-adapter`, `next-auth` | Moderate vuln chain via bundled nodemailer, **no fix available**; also dead weight — auth is custom | DONOR-B custom auth (Phase 2) |
| `nodemailer` < 9.0.3 | HIGH: SMTP command injection, CRLF injection (multiple GHSAs) | `nodemailer` ^9.0.3 |
| `drizzle-orm` < 0.45.2 | HIGH: SQL injection via improperly escaped identifiers (GHSA-gpj5-g38j-94v9) | `drizzle-orm` ^0.45.2 |
| `drizzle-kit` 0.19.0 – 1.0.0-beta | Moderate: vulnerable esbuild dev-server chain (@esbuild-kit) | `drizzle-kit` ^0.31.10 |
| `next-mdx-remote` (all versions used in SOURCE, 4.x–5.x) | HIGH: arbitrary code execution in SSR of MDX | Dropped. Lecture content uses structured rich text, not remote MDX. |
| `@mdxeditor/editor` ≤ 4.0.3 | Moderate: js-yaml DoS chain | Dropped for v1 (rich text editor decision deferred to Phase 4; if an MDX editor is truly needed use ≥4.0.4 and record a decision) |
| `resend` | Not a vulnerability — excluded by decision D6 (single email transport) | `nodemailer` ^9.0.3 |
| `react-hook-form`, `@hookform/resolvers` | SOURCE legacy — the rebuild standardizes on TanStack Form | `@tanstack/react-form` |

## Approved dependencies (minimum versions; prefer latest satisfying)

Versions mirror DONOR-B (`G:\apps\gateling.com\package.json`) and DONOR-C where newer, all audit-clean as of 2026-07-19. Install per phase — don't front-load.

### Runtime core (Phase 0–1)
| Package | Min version | Phase |
|---|---|---|
| `next` | ^16.2.9 (latest 16 stable) | 0 |
| `react`, `react-dom` | 19.2.4 | 0 |
| `tailwindcss`, `@tailwindcss/postcss` | ^4 | 0 |
| `typescript` | ^5.9 | 0 |
| `@biomejs/biome` (dev) | ^2.2 | 0 |
| `@t3-oss/env-nextjs` | ^0.13 | 0 |
| `zod` | ^4.3.6 | 0 |
| `postgres` | ^3.4.5 | 1 |
| `drizzle-orm` | **^0.45.2** | 1 |
| `drizzle-kit` (dev) | **^0.31.10** | 1 |
| `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` | ^11.16 | 1 |
| `@tanstack/react-query` | ^5.69 | 1 |
| `superjson` | ^2.2 | 1 |
| `@tanstack/react-form` | ^1.29 | 1 |
| `@tanstack/react-table` | ^8.21.3 | 1 |
| `inngest` | ^4.2.4 | 1 |
| `firebase-admin` | ^14 | 1 |
| shadcn/ui deps: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `radix-ui` (or per-primitive `@radix-ui/*`), `cmdk`, `sonner`, `vaul`, `next-themes`, `tw-animate-css` (dev) | latest | 1 |
| `date-fns` (+ `@date-fns/tz`) | ^4.1 | 1 |
| `nuqs` | ^2.8 | 1 (data-table URL state) |

### Auth + email (Phase 2)
| Package | Min version |
|---|---|
| `@upstash/redis` | ^1.37 |
| `@upstash/ratelimit` | ^2.0 |
| `@simplewebauthn/browser`, `@simplewebauthn/server` | ^13.3 |
| `nodemailer` | **^9.0.3** |
| `@types/nodemailer` (dev) | matching |
| `@react-email/components`, `react-email` (dev) | ^0.4 / ^4.2 — only if DONOR-B email templates need them; else plain HTML templates |

### Domain phases
| Package | Min version | Phase |
|---|---|---|
| `googleapis` | ^155 | 7 (Google Forms import) |
| `exceljs` | ^4.4 | 7 (XLSX templates; DONOR-B `lib\csv.ts` covers CSV) |
| `react-day-picker` | ^9.8 | 5 (schedules) |
| `@dnd-kit/*` | latest | 4 (form-builder question ordering) — only if the builder needs drag-and-drop |

### Testing (Phase 0 setup, used throughout)
| Package | Min version |
|---|---|
| `vitest` (dev) | ^4 |
| `@playwright/test` (dev) | ^1.5x |

## Rules

1. **Audit gate:** `npm audit` → 0 vulnerabilities at every phase gate. If a transitive vuln appears with no upstream fix: try version overrides; if impossible, the dependent feature goes to the "not possible" ledger below and its promise is pulled from the landing pages.
2. **No duplicate-purpose deps** — one form lib, one table lib, one email transport, one date lib.
3. **Version pins:** commit the lockfile; upgrades are deliberate (own STATE.md note), never drive-by.

## "Not possible for now" ledger

*Empty.* Every planned feature currently has a non-vulnerable dependency path.

| Feature | Blocked by | Date | Revisit when |
|---|---|---|---|
| — | — | — | — |
