import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { LevelsTable } from "./levels-table";

export const CoursesTable = pgTable(
  "courses",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    description: text(),
    thumbnailUrl: varchar({ length: 2048 }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    deletedAt,
    deletedBy,
  },
  (table) => [
    index("courses_organization_id_idx").on(table.organizationId),
    // Lets child tables (levels, forms, ...) declare a composite
    // (organizationId, courseId) foreign key instead of a bare courseId one,
    // so the database itself rejects a row that names the right course but
    // the wrong org — not just application code (see STATE.md D63).
    unique("courses_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
  ],
);

export const coursesRelations = relations(CoursesTable, ({ one, many }) => ({
  organization: one(OrganizationsTable, {
    fields: [CoursesTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  levels: many(LevelsTable),
}));

export type Course = typeof CoursesTable.$inferSelect;
export type NewCourse = typeof CoursesTable.$inferInsert;
