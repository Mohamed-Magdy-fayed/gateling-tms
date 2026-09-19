import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { commitGroupStudentImport, previewGroupStudentImport } from "./import";
import {
  addGroupStudents,
  createGroup,
  deleteGroup,
  regenerateGroupSessionsForOrg,
  removeGroupStudent,
  updateGroup,
} from "./mutations";
import { getGroup, listGroupStudents, listGroups } from "./queries";
import {
  groupAddStudentsSchema,
  groupDeleteSchema,
  groupMutationSchema,
  groupRemoveStudentSchema,
  groupStudentImportCommitInput,
  groupStudentImportPreviewInput,
  groupUpdateSchema,
  listGroupsInput,
} from "./schemas";

export const groupsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listGroupsInput)
    .query(async ({ ctx, input }) => listGroups(ctx, input)),
  // Reuses groupDeleteSchema — same {id} shape, no need for a near-duplicate.
  get: orgProcedure
    .input(groupDeleteSchema)
    .query(async ({ ctx, input }) => getGroup(ctx, input.id)),
  // Admin/teacher only, unlike its `list`/`get`/`sessions` siblings: the
  // roster carries every trainee's email and phone, so a member with the
  // `student` role reading it would be handed the whole class's contact
  // details. Same reasoning that put `responses.list` behind this gate
  // (STATE.md D75).
  students: orgContentManagerProcedure
    .input(groupDeleteSchema)
    .query(async ({ ctx, input }) => listGroupStudents(ctx, input.id)),
  // A group's sessions live on `sessions.byGroup` (the live-classes feature),
  // not here: the same rows now carry Zoom join links whose visibility rules
  // belong with the rest of the meeting code, and one query beats two that
  // drift apart.
  create: orgContentManagerProcedure
    .input(groupMutationSchema)
    .mutation(async ({ ctx, input }) => createGroup(ctx, input)),
  update: orgContentManagerProcedure
    .input(groupUpdateSchema)
    .mutation(async ({ ctx, input }) => updateGroup(ctx, input)),
  delete: orgContentManagerProcedure
    .input(groupDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteGroup(ctx, input)),
  // Reuses groupDeleteSchema for the same reason `get` does — same {id} shape.
  regenerateSessions: orgContentManagerProcedure
    .input(groupDeleteSchema)
    .mutation(async ({ ctx, input }) =>
      regenerateGroupSessionsForOrg(ctx, input),
    ),
  addStudents: orgContentManagerProcedure
    .input(groupAddStudentsSchema)
    .mutation(async ({ ctx, input }) => addGroupStudents(ctx, input)),
  removeStudent: orgContentManagerProcedure
    .input(groupRemoveStudentSchema)
    .mutation(async ({ ctx, input }) => removeGroupStudent(ctx, input)),
  // Bulk roster assignment from a spreadsheet. Mutations, not queries: both
  // take a file body, and re-running a preview for the same file is the point
  // rather than something to cache.
  importStudentsPreview: orgContentManagerProcedure
    .input(groupStudentImportPreviewInput)
    .mutation(async ({ ctx, input }) => previewGroupStudentImport(ctx, input)),
  importStudentsCommit: orgContentManagerProcedure
    .input(groupStudentImportCommitInput)
    .mutation(async ({ ctx, input }) => commitGroupStudentImport(ctx, input)),
});
