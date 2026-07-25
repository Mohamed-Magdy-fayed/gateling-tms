import { relations } from "drizzle-orm";
import { foreignKey, index, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id } from "@/drizzle/schemas/helpers";
import { GroupsTable } from "./groups-table";
import { TraineesTable } from "./trainees-table";

export const GroupStudentsTable = pgTable(
  "group_students",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    groupId: uuid().notNull(),
    traineeId: uuid().notNull(),
    createdAt,
  },
  (table) => [
    index("group_students_organization_id_idx").on(table.organizationId),
    index("group_students_group_id_idx").on(table.groupId),
    index("group_students_trainee_id_idx").on(table.traineeId),
    unique("group_students_group_id_trainee_id_unique").on(
      table.groupId,
      table.traineeId,
    ),
    foreignKey({
      name: "group_students_organization_group_fk",
      columns: [table.organizationId, table.groupId],
      foreignColumns: [GroupsTable.organizationId, GroupsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "group_students_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
  ],
);

export const groupStudentsRelations = relations(
  GroupStudentsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [GroupStudentsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    group: one(GroupsTable, {
      fields: [GroupStudentsTable.groupId],
      references: [GroupsTable.id],
    }),
    trainee: one(TraineesTable, {
      fields: [GroupStudentsTable.traineeId],
      references: [TraineesTable.id],
    }),
  }),
);

export type GroupStudent = typeof GroupStudentsTable.$inferSelect;
export type NewGroupStudent = typeof GroupStudentsTable.$inferInsert;
