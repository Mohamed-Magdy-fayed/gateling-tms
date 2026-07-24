import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { CoursesTable } from "./courses-table";
import { LecturesTable } from "./lectures-table";

export const LevelsTable = pgTable(
  "levels",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    courseId: uuid().notNull(),
    name: varchar({ length: 256 }).notNull(),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("levels_organization_id_idx").on(table.organizationId),
    index("levels_course_id_idx").on(table.courseId),
    // Composite (organizationId, id) unique + FK, not a bare courseId FK —
    // a plain single-column FK would let a level name the right course but
    // a different org's organizationId; the database now rejects that
    // combination outright instead of relying solely on app-level checks
    // like assertCourseInOrg (STATE.md D63).
    unique("levels_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "levels_organization_course_fk",
      columns: [table.organizationId, table.courseId],
      foreignColumns: [CoursesTable.organizationId, CoursesTable.id],
    }).onDelete("cascade"),
  ],
);

export const levelsRelations = relations(LevelsTable, ({ one, many }) => ({
  organization: one(OrganizationsTable, {
    fields: [LevelsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  course: one(CoursesTable, {
    fields: [LevelsTable.courseId],
    references: [CoursesTable.id],
  }),
  lectures: many(LecturesTable),
}));

export type Level = typeof LevelsTable.$inferSelect;
export type NewLevel = typeof LevelsTable.$inferInsert;
