import { relations } from "drizzle-orm";
import { index, integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
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
    courseId: uuid()
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("levels_organization_id_idx").on(table.organizationId),
    index("levels_course_id_idx").on(table.courseId),
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
