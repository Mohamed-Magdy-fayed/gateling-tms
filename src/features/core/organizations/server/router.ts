import {
  createTRPCRouter,
  orgAdminProcedure,
  orgProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/integrations/trpc/init";
import {
  acceptInvite,
  createOrganization,
  inviteMember,
  removeMember,
  switchActiveOrganization,
  updateMemberRole,
  updateOrganization,
} from "./mutations";
import {
  getActiveOrganization,
  listMembers,
  listMyOrganizations,
  previewInvite,
} from "./queries";
import {
  acceptInviteSchema,
  inviteMemberSchema,
  listMembersInput,
  organizationProfileSchema,
  removeMemberSchema,
  switchActiveOrganizationSchema,
  updateMemberRoleSchema,
} from "./schemas";

export const organizationsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(organizationProfileSchema)
    .mutation(async ({ ctx, input }) => createOrganization(ctx, input)),
  getActive: orgProcedure.query(async ({ ctx }) => getActiveOrganization(ctx)),
  update: orgAdminProcedure
    .input(organizationProfileSchema)
    .mutation(async ({ ctx, input }) => updateOrganization(ctx, input)),
  listMine: protectedProcedure.query(async ({ ctx }) => listMyOrganizations(ctx)),
  switchActive: protectedProcedure
    .input(switchActiveOrganizationSchema)
    .mutation(async ({ ctx, input }) => switchActiveOrganization(ctx, input)),
  members: createTRPCRouter({
    list: orgProcedure
      .input(listMembersInput)
      .query(async ({ ctx, input }) => listMembers(ctx, input)),
    invite: orgAdminProcedure
      .input(inviteMemberSchema)
      .mutation(async ({ ctx, input }) => inviteMember(ctx, input)),
    updateRole: orgAdminProcedure
      .input(updateMemberRoleSchema)
      .mutation(async ({ ctx, input }) => updateMemberRole(ctx, input)),
    remove: orgAdminProcedure
      .input(removeMemberSchema)
      .mutation(async ({ ctx, input }) => removeMember(ctx, input)),
  }),
  invites: createTRPCRouter({
    // Public: the accept-invite landing page must be able to check a token
    // (and decide sign-up vs. sign-in) before the visitor is authenticated.
    preview: publicProcedure
      .input(acceptInviteSchema)
      .query(async ({ ctx, input }) => previewInvite(ctx, input.token)),
    accept: protectedProcedure
      .input(acceptInviteSchema)
      .mutation(async ({ ctx, input }) => acceptInvite(ctx, input)),
  }),
});
