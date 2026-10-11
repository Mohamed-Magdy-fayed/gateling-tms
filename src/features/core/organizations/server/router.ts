import {
  createTRPCRouter,
  orgAdminProcedure,
  orgProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/integrations/trpc/init";
import {
  createBranch,
  getBranchScope,
  listBranches,
  listWritableBranches,
  setMemberBranches,
  updateBranch,
} from "./branches";
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
  getOrganizationUsage,
  listAllMembers,
  listMembers,
  listMyOrganizations,
  previewInvite,
} from "./queries";
import {
  acceptInviteSchema,
  createBranchSchema,
  inviteMemberSchema,
  listMembersInput,
  organizationProfileSchema,
  removeMemberSchema,
  setMemberBranchesSchema,
  switchActiveOrganizationSchema,
  updateBranchSchema,
  updateMemberRoleSchema,
} from "./schemas";

export const organizationsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(organizationProfileSchema)
    .mutation(async ({ ctx, input }) => createOrganization(ctx, input)),
  getActive: orgProcedure.query(async ({ ctx }) => getActiveOrganization(ctx)),
  // Readable by any member: usage against the plan is not sensitive, and the
  // limit notices on the trainees/courses pages are shown to teachers too.
  usage: orgProcedure.query(async ({ ctx }) => getOrganizationUsage(ctx)),
  update: orgAdminProcedure
    .input(organizationProfileSchema)
    .mutation(async ({ ctx, input }) => updateOrganization(ctx, input)),
  listMine: protectedProcedure.query(async ({ ctx }) =>
    listMyOrganizations(ctx),
  ),
  switchActive: protectedProcedure
    .input(switchActiveOrganizationSchema)
    .mutation(async ({ ctx, input }) => switchActiveOrganization(ctx, input)),
  branches: createTRPCRouter({
    list: orgProcedure.query(async ({ ctx }) => listBranches(ctx)),
    scope: orgProcedure.query(async ({ ctx }) => getBranchScope(ctx)),
    // What a create form offers when "All branches" is selected.
    writable: orgProcedure.query(async ({ ctx }) => listWritableBranches(ctx)),
    create: orgAdminProcedure
      .input(createBranchSchema)
      .mutation(async ({ ctx, input }) => createBranch(ctx, input)),
    update: orgAdminProcedure
      .input(updateBranchSchema)
      .mutation(async ({ ctx, input }) => updateBranch(ctx, input)),
  }),
  members: createTRPCRouter({
    list: orgProcedure
      .input(listMembersInput)
      .query(async ({ ctx, input }) => listMembers(ctx, input)),
    // The whole list for the client-mode members table; pickers use `list`.
    listAll: orgProcedure.query(async ({ ctx }) => listAllMembers(ctx)),
    invite: orgAdminProcedure
      .input(inviteMemberSchema)
      .mutation(async ({ ctx, input }) => inviteMember(ctx, input)),
    updateRole: orgAdminProcedure
      .input(updateMemberRoleSchema)
      .mutation(async ({ ctx, input }) => updateMemberRole(ctx, input)),
    setBranches: orgAdminProcedure
      .input(setMemberBranchesSchema)
      .mutation(async ({ ctx, input }) => setMemberBranches(ctx, input)),
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
