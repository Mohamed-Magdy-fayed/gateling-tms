import { z } from "zod";

export const sessionScopeValues = ["upcoming", "past"] as const;
export type SessionScope = (typeof sessionScopeValues)[number];

export const listSessionsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  // The agenda is time-shaped, not sort-shaped: "what's next" and "what
  // already happened" are the only two views anyone asked for, and each has
  // exactly one sensible order (soonest first / most recent first).
  scope: z.enum(sessionScopeValues).default("upcoming"),
  groupId: z.uuid().optional(),
});

export const sessionsByGroupSchema = z.object({
  groupId: z.uuid(),
});

export type ListSessionsInput = z.infer<typeof listSessionsInput>;
export type SessionsByGroupInput = z.infer<typeof sessionsByGroupSchema>;
