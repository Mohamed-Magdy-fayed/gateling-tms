import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  CoursesTable,
  LecturesTable,
  LevelsTable,
} from "@/drizzle/schemas/content";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { FormSectionsTable } from "./form-sections-table";

export const formTypeValues = [
  "assignment",
  "quiz",
  "final",
  "placement",
] as const;
export type FormType = (typeof formTypeValues)[number];
export const formTypeEnum = pgEnum("form_type", formTypeValues);

export const formStatusValues = ["draft", "published", "archived"] as const;
export type FormStatus = (typeof formStatusValues)[number];
export const formStatusEnum = pgEnum("form_status", formStatusValues);

export const FormsTable = pgTable(
  "forms",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    // Attachable to a course, level, or lecture — all nullable, a form can
    // also stand alone (e.g. a placement test taken before any enrollment).
    courseId: uuid().references(() => CoursesTable.id, { onDelete: "cascade" }),
    levelId: uuid().references(() => LevelsTable.id, { onDelete: "cascade" }),
    lectureId: uuid().references(() => LecturesTable.id, {
      onDelete: "cascade",
    }),
    type: formTypeEnum().notNull(),
    status: formStatusEnum().notNull().default("draft"),
    title: varchar({ length: 256 }).notNull(),
    description: text(),
    createdAt,
    updatedAt,
  },
  (table) => [index("forms_organization_id_idx").on(table.organizationId)],
);

export const formsRelations = relations(FormsTable, ({ one, many }) => ({
  organization: one(OrganizationsTable, {
    fields: [FormsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  course: one(CoursesTable, {
    fields: [FormsTable.courseId],
    references: [CoursesTable.id],
  }),
  level: one(LevelsTable, {
    fields: [FormsTable.levelId],
    references: [LevelsTable.id],
  }),
  lecture: one(LecturesTable, {
    fields: [FormsTable.lectureId],
    references: [LecturesTable.id],
  }),
  sections: many(FormSectionsTable),
}));

export type Form = typeof FormsTable.$inferSelect;
export type NewForm = typeof FormsTable.$inferInsert;
