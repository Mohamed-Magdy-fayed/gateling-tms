import { z } from "zod";
import { organizationMembershipRoleValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max, translationKey("forms.validation.max128"))
    .optional()
    .or(z.literal(""));

export const organizationProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(128, translationKey("forms.validation.max128")),
  businessName: optionalTrimmed(256),
  phone: optionalTrimmed(32),
  website: z
    .url(translationKey("organizations.validation.invalidWebsite"))
    .optional()
    .or(z.literal("")),
});

export const listMembersInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.email(translationKey("auth.validation.invalidEmail")),
  role: z.enum(organizationMembershipRoleValues),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export const updateMemberRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(organizationMembershipRoleValues),
});

export const removeMemberSchema = z.object({
  userId: z.uuid(),
});

export const switchActiveOrganizationSchema = z.object({
  organizationId: z.uuid(),
});

export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type ListMembersInput = z.infer<typeof listMembersInput>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type SwitchActiveOrganizationInput = z.infer<
  typeof switchActiveOrganizationSchema
>;
