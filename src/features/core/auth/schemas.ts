import { z } from "zod";

/**
 * `activeOrganizationId` is the only org-scoping data the session carries —
 * role is deliberately NOT stored here. Unlike DONOR-B (one global role per
 * user), TMS roles live on `organization_memberships` (a user can be an admin
 * in one org and a teacher in another), so `orgProcedure` (Phase 2 step 5)
 * looks the role up per-request instead of trusting a cached session value.
 */
export const sessionSchema = z.object({
  sessionId: z.string(),
  exp: z.number(),
  hasPassword: z.boolean().optional().default(false),
  activeOrganizationId: z.string().optional().nullable(),
  user: z.object({
    id: z.string(),
    email: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    emailVerifiedAt: z.preprocess(
      (val) => (val instanceof Date ? val.toISOString() : val),
      z.string().optional().nullable(),
    ),
  }),
});
