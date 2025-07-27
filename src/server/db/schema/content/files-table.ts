import { MaterialsTable } from "@/server/db/schema/content/materials-table";
import { createdAt, createdBy, id, updatedAt, updatedBy, deletedAt, deletedBy } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

export const FilesTable = pgTable(
    "files",
    (d) => ({
        id,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy,
        deletedBy,
        deletedAt,

        fileName: d.varchar({ length: 256 }).notNull(),
        path: d.varchar({ length: 256 }).notNull().unique(),
        size: d.integer().notNull(),
        type: d.varchar({ length: 64 }).notNull(),

        materialId: d.uuid().references(() => MaterialsTable.id).notNull(),
    }),
    (t) => [
        index("path_idx").on(t.path),
    ],
);

export const fileRelations = relations(FilesTable, ({ one, many }) => ({
    MaterialsTable: one(MaterialsTable, {
        fields: [FilesTable.materialId],
        references: [MaterialsTable.id]
    }),
}))

export type File = typeof FilesTable.$inferSelect;
export type FileInsert = typeof FilesTable.$inferInsert;
