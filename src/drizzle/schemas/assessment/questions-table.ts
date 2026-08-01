import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { AnswersTable } from "./answers-table";
import { FormSectionsTable } from "./form-sections-table";

export const questionTypeValues = [
  "single_choice",
  "multiple_choice",
  "short_answer",
  "long_answer",
  "date",
  "time",
] as const;
export type QuestionType = (typeof questionTypeValues)[number];
export const questionTypeEnum = pgEnum("question_type", questionTypeValues);

/**
 * The types answered by typing rather than by choosing. They share one storage
 * shape (`FormResponseAnswer.text`) and one grading path: normalise, compare
 * against the accepted wordings, escalate to the model only if that can't
 * settle it. A date or time answer is just a text answer whose input has a
 * picker — the alternative was two more columns and two more scoring branches
 * to express "2026-09-01" more precisely than a string already does.
 *
 * Every branch that used to read `type === "short_answer"` reads this instead,
 * so adding a seventh type is one edit rather than a hunt.
 */
const TEXT_QUESTION_TYPES = new Set<QuestionType>([
  "short_answer",
  "long_answer",
  "date",
  "time",
]);

export function isTextQuestion(type: QuestionType): boolean {
  return TEXT_QUESTION_TYPES.has(type);
}

/** The types answered by picking from the question's answer rows. */
export function isChoiceQuestion(type: QuestionType): boolean {
  return !TEXT_QUESTION_TYPES.has(type);
}

export const QuestionsTable = pgTable(
  "questions",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    sectionId: uuid().notNull(),
    text: text().notNull(),
    /** Help text under the question — Google Forms' per-item description. */
    description: text(),
    type: questionTypeEnum().notNull().default("single_choice"),
    points: integer().notNull().default(1),
    /**
     * Answering is compulsory. Carried from an import and shown to the
     * respondent; submission is not blocked on it, since a partially answered
     * response still scores and a hard block would lose work.
     */
    isRequired: boolean().notNull().default(false),
    /** An image that is part of the question — a diagram, a passage scan. */
    imageUrl: text(),
    imageAlt: varchar({ length: 256 }),
    /** Pending-import counterpart of `imageUrl` — see `form_blocks.sourceUrl`. */
    imageSourceUrl: text(),
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
