import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  unique,
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
    sectionId: uuid().notNull(),
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
    unique("questions_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "questions_organization_section_fk",
      columns: [table.organizationId, table.sectionId],
      foreignColumns: [FormSectionsTable.organizationId, FormSectionsTable.id],
    }).onDelete("cascade"),
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
