import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";
import { MINUTES_PER_DAY, SLOT_MINUTES } from "../lib/week";

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

/**
 * One week of the calendar. `weekStart` is a local date in the academy's
 * zone and must be a Saturday (lib/week.ts `WEEK_START_DAY`) — the server
 * checks that against the organization's time zone, which the client
 * doesn't know at validation time.
 */
export const weekSessionsInput = z.object({
  weekStart: z.iso.date(translationKey("groups.validation.date")),
  teacherId: idSchema.optional(),
});

export const sessionsByGroupSchema = z.object({
  groupId: z.uuid(),
});

export const sessionIdSchema = z.object({
  id: z.uuid(),
});

/**
 * An optional reference: a real id, or the empty string a "none" select option
 * submits, or null — the same shape the group form uses for its teacher.
 */
const optionalReference = z.union([idSchema, z.literal("")]).nullable();

/** Longest a single class may be — twelve hours is already absurd. */
export const MAX_SESSION_DURATION_MINUTES = MINUTES_PER_DAY / 2;

/**
 * What the calendar may change about a session: when, how long, and who.
 * Everything else — status, the meeting — is set by the class running, not
 * by dragging a block.
 */
export const sessionUpdateSchema = z.object({
  id: idSchema,
  scheduledAt: z
    .date()
    // Every real time zone's offset is a multiple of 15 minutes, so an
    // instant on the local 15-minute grid is on the UTC one too; checking
    // UTC here avoids needing the organization's zone inside a schema.
    .refine(
      (value) =>
        value.getUTCMinutes() % SLOT_MINUTES === 0 &&
        value.getUTCSeconds() === 0 &&
        value.getUTCMilliseconds() === 0,
      { message: translationKey("sessions.validation.notOnGrid") },
    ),
  durationMinutes: z
    .number()
    .int()
    .min(SLOT_MINUTES, translationKey("sessions.validation.notOnGrid"))
    .max(
      MAX_SESSION_DURATION_MINUTES,
      translationKey("sessions.validation.tooLong"),
    )
    .refine((value) => value % SLOT_MINUTES === 0, {
      message: translationKey("sessions.validation.notOnGrid"),
    }),
  teacherId: optionalReference,
});

export type ListSessionsInput = z.infer<typeof listSessionsInput>;
export type WeekSessionsInput = z.infer<typeof weekSessionsInput>;
export type SessionsByGroupInput = z.infer<typeof sessionsByGroupSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
