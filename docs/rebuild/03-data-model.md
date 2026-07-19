# 03 — Data Model

Target schema for `G:\apps\gateling-tms`. Sources: auth/tenancy shape from DONOR-B (`G:\apps\gateling.com\src\drizzle\schemas\auth\`), domain tables re-derived from SOURCE (`C:\Users\moham\OneDrive\Desktop\gateling-tms\src\drizzle\schemas\` and `src\auth\tables\`). Do **not** copy SOURCE tables verbatim — apply the changes column.

## Global conventions

- Shared helpers (id, `createdAt/By`, `updatedAt/By`, soft-delete `deletedAt/By`): adapt DONOR-B `src\drizzle\schemas\helpers.ts` (SOURCE equivalents: `src\drizzle\schemas\helpers.ts`, `src\auth\tables\schema-helpers.ts`).
- **Tenancy invariant (AD-1): every table in the "Tenant-owned" section has `organizationId` FK → `organizations.id`, cascade delete, indexed.** This is the biggest correction vs SOURCE (which scoped only `courses` and `zoom_clients`).
- Schema organization: `src\drizzle\schemas\{auth,org,content,assessment,learning,live}\` with a `schema.ts` barrel (DONOR-B pattern). One table per file, named `<entity>-table.ts`.
- Migrations: generated only (`db:generate` → `db:migrate`), committed with `meta\` + `_journal.json`.

## Auth & tenancy tables (donor: B, adapt branch→organization)

| Table | Donor reference | Changes for TMS |
|---|---|---|
| `users` | B `schemas\auth\users-table.ts` | Global user (not org-bound — membership decides org access). Keep `parentId` self-ref idea from SOURCE `src\auth\tables\users-table.ts` for student→parent (no UI in v1). |
| `user_credentials` | B `user-credentials-table.ts` | as-is |
| `user_oauth_accounts` | B `user-oauth-accounts-table.ts` | Google only in v1 |
| `biometric_credentials` | B `biometric-credentials-table.ts` | passkeys, as-is |
| `user_tokens` | B `user-tokens-table.ts` | email-verify / reset / org-invite tokens |
| `organizations` | B `branches-table.ts` renamed | + plan fields: `plan` enum (`free\|basic\|professional\|enterprise`, default `free`), usage counters `studentCount`, `courseCount`, `storageBytes` (AD-6); business info from the get-started wizard (businessName, phone, website) |
| `organization_memberships` | B `branch-memberships-table.ts` renamed | `role` enum on membership: `admin \| teacher \| student` for v1 (SOURCE's 11-role list in `users-table.ts` collapses to these three + future roles arrive with paid modules). Unique (userId, organizationId). |

Sessions are Redis, not Postgres — no sessions table.

## Tenant-owned domain tables (source: SOURCE schemas, re-derived)

### Content (SOURCE `src\drizzle\schemas\content-library\`)
| Table | SOURCE file | Changes |
|---|---|---|
| `courses` | `courses-table.ts` | already had `organizationId` — keep; add nothing HBS-specific |
| `levels` | `levels-table.ts` | **+ organizationId**; FK course |
| `lectures` | `lectures-table.ts` | **+ organizationId**; FK level; content = structured rich text + attachment refs (no MDX remote); media via Firebase paths |

### Assessments (SOURCE `src\drizzle\schemas\content-library\forms-tables\`)
| Table | SOURCE file | Changes |
|---|---|---|
| `forms` | `forms-table.ts` | **+ organizationId**; keep type enum (`assignment\|quiz\|final\|placement`) + status (`draft\|published\|archived`); attachable to course/level/lecture (nullable FKs) |
| `form_sections` | `sections-table.ts` | **+ organizationId** |
| `questions` | `questions-table.ts` | **+ organizationId** |
| `answers` | `answers-table.ts` | **+ organizationId** |
| `form_responses` | `responses-table.ts` | **+ organizationId**; respondent FK users |
| `form_analytics` | `analytics-table.ts` | **+ organizationId**; evaluate in Phase 4 — drop if derivable by query |
| `google_integrations` | `google-integrations-table.ts` | **+ organizationId**; per-org Google OAuth grant for Forms import |

### Learning flow (SOURCE `src\drizzle\schemas\learning-flow\`)
| Table | SOURCE file | Changes |
|---|---|---|
| `enrollments` | `enrollments-table.ts` (`students_courses`) | **+ organizationId**; keep status enum but **trim payment states for v1**: `placementTest → waiting → ongoing → completed → cancelled/postponed` (orderCreated/orderPaid/refunded return with Course Store — note in enum comment) |
| `enrollment_levels` | `enrollments-levels-table.ts` | **+ organizationId**; per-level progress |
| `groups` | `groups-table.ts` | **+ organizationId**; class with weekly schedule (JSON schedule shape from SOURCE); **courseId nullable** — a group must be creatable without any course (instant onboarding) |
| `group_students` | `groups-students-table.ts` | **+ organizationId** |
| `placement_tests` | `placement-tests-table.ts` | **+ organizationId**; links form → student → resulting level |
| `certificates` | `certificates-table.ts` | **+ organizationId** |
| `tests` | `tests-table.ts` | Review in Phase 5: SOURCE has both `tests` and form-type assessments — **merge into forms** if redundant (record decision in STATE.md) |

### Live classes (SOURCE `src\drizzle\schemas\online-lectures\`)
| Table | SOURCE file | Changes |
|---|---|---|
| `zoom_clients` | `zoom-clients-table.ts` | already had `organizationId` — keep; per-org Zoom OAuth credentials |
| `zoom_sessions` | `zoom-sessions-table.ts` | **+ organizationId**; FK group; generated from schedule by Inngest |
| `session_students` | `session-student-table.ts` | **+ organizationId**; attendance records |

### Dropped from SOURCE
- `messages` (`schemas\core\messages-table.ts`) — SOURCE contact-form storage; v1 landing contact form can send email via Inngest without a table, or re-add later. Decide in Phase 3 (record in STATE.md).
- All NextAuth remnants — none exist as tables, but `@auth/*` deps are banned regardless.

## Entity relationships (v1)

```
organizations 1─* organization_memberships *─1 users
organizations 1─* courses 1─* levels 1─* lectures
organizations 1─* groups *─* users(students)   [group_students; groups.courseId nullable]
organizations 1─* forms 1─* form_sections 1─* questions 1─* answers
forms 1─* form_responses *─1 users
users(student) 1─* enrollments *─1 courses ; enrollments 1─* enrollment_levels
organizations 1─* zoom_clients ; groups 1─* zoom_sessions 1─* session_students
placement_tests: form ↔ student ↔ assigned level
certificates: student ↔ course/group
```

## Table count check

7 auth/org + 3 content + 7 assessment + 7 learning + 3 live = **27 tables** (before the Phase-5 `tests` merge decision and Phase-4 `form_analytics` review, which may reduce to 25).
