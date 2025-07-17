import { CoursesTable } from "@/server/db/schema/content/courses-table";
import { createdAt, createdBy, id, updatedAt, updatedBy } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const LevelsTable = pgTable(
    "levels",
    (d) => ({
        id,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy,

        name: d.varchar({ length: 256 }).notNull(),

        courseId: d.uuid().references(() => CoursesTable.id).notNull(),
    }),
);

export const levelRelations = relations(LevelsTable, ({ one, many }) => ({
    CoursesTable: one(CoursesTable, {
        fields: [LevelsTable.courseId],
        references: [CoursesTable.id]
    }),
}))

export type Level = typeof LevelsTable.$inferSelect;
export type LevelInsert = typeof LevelsTable.$inferInsert;
