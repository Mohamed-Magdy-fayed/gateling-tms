import { LevelsTable } from "@/server/db/schema/content/levels-table";
import { OrganizationsTable } from "@/server/db/schema/organizations-table";
import { createdAt, createdBy, id, updatedAt, updatedBy } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const CoursesTable = pgTable(
    "courses",
    (d) => ({
        id,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy,

        name: d.varchar({ length: 256 }).notNull(),
        description: d.varchar({ length: 256 }).notNull(),
        image: d.varchar({ length: 255 }),

        organizationId: d.uuid().references(() => OrganizationsTable.id).notNull(),
    }),
);

export const courseRelations = relations(CoursesTable, ({ one, many }) => ({
    OrganizationsTable: one(OrganizationsTable, {
        fields: [CoursesTable.organizationId],
        references: [OrganizationsTable.id]
    }),
    LevelsTable: many(LevelsTable)
}))

export type Course = typeof CoursesTable.$inferSelect;
export type CourseInsert = typeof CoursesTable.$inferInsert;
