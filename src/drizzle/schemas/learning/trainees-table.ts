import { relations } from "drizzle-orm";
import { index, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { OrganizationsTable, UsersTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";

// A trainee is its own record, deliberately not a `users` row — most
// trainees never sign in (created directly by an admin/teacher with just a
// name, no invitation), so tying the roster to the auth system would force
// every trainee to carry a login identity it doesn't need (see STATE.md
// D77). `userId` is the optional, later bridge: set once/if this trainee is
// ever invited to a real account.
export const TraineesTable = pgTable(
  "trainees",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    phone: varchar({ length: 32 }),
    email: varchar({ length: 256 }),
    userId: uuid().references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    deletedAt,
    deletedBy,
  },
  (table) => [
    index("trainees_organization_id_idx").on(table.organizationId),
    // Lets child tables (enrollments, group_students, placement_tests,
    // certificates) declare a composite (organizationId, traineeId) foreign
    // key instead of a bare traineeId one — same pattern as courses-table.ts
    // (STATE.md D63).
    unique("trainees_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
  ],
);

export const traineesRelations = relations(TraineesTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [TraineesTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  user: one(UsersTable, {
    fields: [TraineesTable.userId],
    references: [UsersTable.id],
  }),
}));

export type Trainee = typeof TraineesTable.$inferSelect;
export type NewTrainee = typeof TraineesTable.$inferInsert;
