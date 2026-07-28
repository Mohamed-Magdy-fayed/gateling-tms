import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  addGroupStudents,
  createGroup,
  deleteGroup,
  removeGroupStudent,
  updateGroup,
} from "./mutations";
import {
  getGroup,
  listGroupSessions,
  listGroupStudents,
  listGroups,
} from "./queries";
import {
  groupAddStudentsSchema,
  groupDeleteSchema,
  groupMutationSchema,
  groupRemoveStudentSchema,
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
  sessions: orgProcedure
    .input(groupDeleteSchema)
    .query(async ({ ctx, input }) => listGroupSessions(ctx, input.id)),
  create: orgContentManagerProcedure
    .input(groupMutationSchema)
    .mutation(async ({ ctx, input }) => createGroup(ctx, input)),
  update: orgContentManagerProcedure
    .input(groupUpdateSchema)
    .mutation(async ({ ctx, input }) => updateGroup(ctx, input)),
  delete: orgContentManagerProcedure
    .input(groupDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteGroup(ctx, input)),
  addStudents: orgContentManagerProcedure
    .input(groupAddStudentsSchema)
    .mutation(async ({ ctx, input }) => addGroupStudents(ctx, input)),
  removeStudent: orgContentManagerProcedure
    .input(groupRemoveStudentSchema)
    .mutation(async ({ ctx, input }) => removeGroupStudent(ctx, input)),
});
