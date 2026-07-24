import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable, UsersTable } from "@/drizzle/schemas/auth";
import { createdAt, id } from "@/drizzle/schemas/helpers";
import { FormsTable } from "./forms-table";

export type FormResponseAnswer = {
  questionId: string;
  selectedAnswerIds?: string[];
  text?: string;
};

export const FormResponsesTable = pgTable(
  "form_responses",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    formId: uuid().notNull(),
    // Users are global (not org-scoped, see D4/AD-1's own tenancy model), so
    // this stays a plain single-column FK — a composite FK only makes sense
    // between two org-scoped tables.
    respondentUserId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    answers: jsonb().$type<FormResponseAnswer[]>().notNull().default([]),
    // Null until scored — only auto-computed for question types that can be
    // (single/multiple choice); short-answer questions need manual grading.
    score: integer(),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt,
  },
  (table) => [
    index("form_responses_organization_id_idx").on(table.organizationId),
    index("form_responses_form_id_idx").on(table.formId),
    index("form_responses_respondent_user_id_idx").on(table.respondentUserId),
    foreignKey({
      name: "form_responses_organization_form_fk",
      columns: [table.organizationId, table.formId],
      foreignColumns: [FormsTable.organizationId, FormsTable.id],
    }).onDelete("cascade"),
  ],
);

export const formResponsesRelations = relations(
  FormResponsesTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [FormResponsesTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    form: one(FormsTable, {
      fields: [FormResponsesTable.formId],
      references: [FormsTable.id],
    }),
    respondent: one(UsersTable, {
      fields: [FormResponsesTable.respondentUserId],
      references: [UsersTable.id],
    }),
  }),
);

export type FormResponse = typeof FormResponsesTable.$inferSelect;
export type NewFormResponse = typeof FormResponsesTable.$inferInsert;
