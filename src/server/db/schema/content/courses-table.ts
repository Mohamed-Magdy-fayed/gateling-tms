import { OrganizationsTable } from "@/server/db/schema/organizations-table";
import { createdAt, id, updatedAt } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const CoursesTable = pgTable(
    "courses",
    (d) => ({
        id,
        createdAt,
        updatedAt,

        organizationId: d.uuid().references(() => OrganizationsTable.id).notNull(),
        name: d.varchar({ length: 256 }).notNull(),
        description: d.varchar({ length: 256 }).notNull().unique(),
        image: d.varchar({ length: 255 }),
    }),
);

export const courseRelations = relations(CoursesTable, ({ one, many }) => ({
    OrganizationsTable: one(OrganizationsTable, {
        fields: [CoursesTable.organizationId],
        references: [OrganizationsTable.id]
    }),
}))

export type Course = typeof CoursesTable.$inferSelect;
export type CourseInsert = typeof CoursesTable.$inferInsert;
