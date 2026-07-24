import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { QuestionsTable } from "./questions-table";

export const AnswersTable = pgTable(
  "answers",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    questionId: uuid()
      .notNull()
      .references(() => QuestionsTable.id, { onDelete: "cascade" }),
    text: text().notNull(),
    isCorrect: boolean().notNull().default(false),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("answers_organization_id_idx").on(table.organizationId),
    index("answers_question_id_idx").on(table.questionId),
  ],
);

export const answersRelations = relations(AnswersTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [AnswersTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  question: one(QuestionsTable, {
    fields: [AnswersTable.questionId],
    references: [QuestionsTable.id],
  }),
}));

export type Answer = typeof AnswersTable.$inferSelect;
export type NewAnswer = typeof AnswersTable.$inferInsert;
