import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { AnswersTable } from "./answers-table";
import { FormSectionsTable } from "./form-sections-table";

export const questionTypeValues = [
  "single_choice",
  "multiple_choice",
  "short_answer",
] as const;
export type QuestionType = (typeof questionTypeValues)[number];
export const questionTypeEnum = pgEnum("question_type", questionTypeValues);

export const QuestionsTable = pgTable(
  "questions",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    sectionId: uuid()
      .notNull()
      .references(() => FormSectionsTable.id, { onDelete: "cascade" }),
    text: text().notNull(),
    type: questionTypeEnum().notNull().default("single_choice"),
    points: integer().notNull().default(1),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("questions_organization_id_idx").on(table.organizationId),
    index("questions_section_id_idx").on(table.sectionId),
  ],
);

export const questionsRelations = relations(
  QuestionsTable,
  ({ one, many }) => ({
    organization: one(OrganizationsTable, {
      fields: [QuestionsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    section: one(FormSectionsTable, {
      fields: [QuestionsTable.sectionId],
      references: [FormSectionsTable.id],
    }),
    answers: many(AnswersTable),
  }),
);

export type Question = typeof QuestionsTable.$inferSelect;
export type NewQuestion = typeof QuestionsTable.$inferInsert;
