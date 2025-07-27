import { FilesTable } from "@/server/db/schema/content/files-table";
import { LevelsTable } from "@/server/db/schema/content/levels-table";
import { createdAt, createdBy, id, updatedAt, updatedBy } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const MaterialsTable = pgTable(
    "materials",
    (d) => ({
        id,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy,

        order: d.serial().notNull(),
        title: d.varchar({ length: 256 }).notNull(),
        subtitle: d.varchar({ length: 256 }),
        description: d.text(),

        levelId: d.uuid().references(() => LevelsTable.id).notNull(),
    }),
);

export const materialRelations = relations(MaterialsTable, ({ one, many }) => ({
    LevelsTable: one(LevelsTable, {
        fields: [MaterialsTable.levelId],
        references: [LevelsTable.id]
    }),
    FilesTabke: many(FilesTable),
}))

export type Material = typeof MaterialsTable.$inferSelect & { levelName: string | null };
export type MaterialInsert = typeof MaterialsTable.$inferInsert;
