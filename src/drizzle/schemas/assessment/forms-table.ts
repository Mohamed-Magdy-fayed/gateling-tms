import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  unique,
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
    // Composite FKs below still apply whenever one of these is set (a NULL
    // column short-circuits a composite FK check in Postgres, so "stand
    // alone" keeps working).
    courseId: uuid(),
    levelId: uuid(),
    lectureId: uuid(),
    type: formTypeEnum().notNull(),
    status: formStatusEnum().notNull().default("draft"),
    title: varchar({ length: 256 }).notNull(),
    description: text(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("forms_organization_id_idx").on(table.organizationId),
    unique("forms_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "forms_organization_course_fk",
      columns: [table.organizationId, table.courseId],
      foreignColumns: [CoursesTable.organizationId, CoursesTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "forms_organization_level_fk",
      columns: [table.organizationId, table.levelId],
      foreignColumns: [LevelsTable.organizationId, LevelsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "forms_organization_lecture_fk",
      columns: [table.organizationId, table.lectureId],
      foreignColumns: [LecturesTable.organizationId, LecturesTable.id],
    }).onDelete("cascade"),
  ],
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
