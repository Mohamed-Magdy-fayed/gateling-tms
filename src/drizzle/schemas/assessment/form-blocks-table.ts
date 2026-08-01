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
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { FormSectionsTable } from "./form-sections-table";

export const formBlockKindValues = ["text", "image", "video"] as const;
export type FormBlockKind = (typeof formBlockKindValues)[number];
export const formBlockKindEnum = pgEnum("form_block_kind", formBlockKindValues);

/**
 * Content inside a form that isn't a question: a passage to read, a diagram to
 * look at, a video to watch before answering.
 *
 * A separate table rather than a fourth `question_type`, because a block has
 * no answer, earns no points and is never graded — putting it in `questions`
 * would mean every scorer, grader and answer-sheet branch carrying a "…except
 * this one, which isn't really a question" case.
 *
 * `order` is shared with `questions` in the same section: a Google Form (and a
 * comprehension exercise generally) interleaves passages and the questions
 * about them, and two independent sequences could not express "paragraph,
 * question, paragraph". `sections/server/reorder.ts` owns that shared space —
 * neither table allocates or swaps an `order` on its own.
 */
export const FormBlocksTable = pgTable(
  "form_blocks",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    sectionId: uuid().notNull(),
    kind: formBlockKindEnum().notNull().default("text"),
    /** Optional heading. A passage often has none, an image usually does. */
    title: varchar({ length: 256 }),
    /** The prose of a text block. Plain text, rendered escaped — never HTML. */
    body: text(),
    /**
     * Where the media actually lives: a Firebase Storage URL for an image, an
     * embeddable `youtube-nocookie.com` URL for a video. Null on a text block,
     * and null on an imported image until the media job has fetched it.
     */
    mediaUrl: text(),
    mediaAlt: varchar({ length: 256 }),
    /**
     * An imported image's original URL, pending fetch. Google's `contentUri` is
     * signed and short-lived, so it is copied into our own storage rather than
     * hot-linked; this column is what the media job works from, and it is
     * cleared once the copy lands (or is abandoned). Never rendered.
     */
    sourceUrl: text(),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("form_blocks_organization_id_idx").on(table.organizationId),
    index("form_blocks_section_id_idx").on(table.sectionId),
    unique("form_blocks_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "form_blocks_organization_section_fk",
      columns: [table.organizationId, table.sectionId],
      foreignColumns: [FormSectionsTable.organizationId, FormSectionsTable.id],
    }).onDelete("cascade"),
  ],
);

export const formBlocksRelations = relations(FormBlocksTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [FormBlocksTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  section: one(FormSectionsTable, {
    fields: [FormBlocksTable.sectionId],
    references: [FormSectionsTable.id],
  }),
}));

export type FormBlock = typeof FormBlocksTable.$inferSelect;
export type NewFormBlock = typeof FormBlocksTable.$inferInsert;
