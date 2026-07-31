import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listMeetingAccountsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

/**
 * The onMeeting sign-in. `password` is the admin's own onMeeting password: it
 * is exchanged for API keys in one request and is never stored, logged, or
 * echoed back (STATE.md D146) — which is also why it has no length or shape
 * rule beyond "present". Validating someone else's password policy here would
 * only reject accounts that work.
 */
export const connectMeetingAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(200, translationKey("forms.validation.max200")),
  email: z.email(translationKey("auth.validation.invalidEmail")),
  password: z.string().min(1, translationKey("forms.validation.required")),
});

export const meetingAccountIdSchema = z.object({
  id: z.uuid(),
});

export const renameMeetingAccountSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
});

export type ListMeetingAccountsInput = z.infer<typeof listMeetingAccountsInput>;
export type ConnectMeetingAccountInput = z.infer<
  typeof connectMeetingAccountSchema
>;
export type MeetingAccountIdInput = z.infer<typeof meetingAccountIdSchema>;
export type RenameMeetingAccountInput = z.infer<
  typeof renameMeetingAccountSchema
>;
