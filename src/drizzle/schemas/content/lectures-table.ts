import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { LevelsTable } from "./levels-table";

export type LectureAttachment = {
  url: string;
  name: string;
  sizeBytes: number;
};

export const LecturesTable = pgTable(
  "lectures",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    levelId: uuid()
      .notNull()
      .references(() => LevelsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    description: text(),
    // Structured plain text / markdown-lite — never next-mdx-remote (banned,
    // see docs/rebuild/02-dependencies.md).
    content: text(),
    attachments: jsonb().$type<LectureAttachment[]>().notNull().default([]),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("lectures_organization_id_idx").on(table.organizationId),
    index("lectures_level_id_idx").on(table.levelId),
  ],
);

export const lecturesRelations = relations(LecturesTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [LecturesTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  level: one(LevelsTable, {
    fields: [LecturesTable.levelId],
    references: [LevelsTable.id],
  }),
}));

export type Lecture = typeof LecturesTable.$inferSelect;
export type NewLecture = typeof LecturesTable.$inferInsert;
