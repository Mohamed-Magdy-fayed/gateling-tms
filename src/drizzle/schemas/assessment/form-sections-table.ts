import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { FormsTable } from "./forms-table";
import { QuestionsTable } from "./questions-table";

export const FormSectionsTable = pgTable(
  "form_sections",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    formId: uuid().notNull(),
    title: varchar({ length: 256 }).notNull(),
    order: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("form_sections_organization_id_idx").on(table.organizationId),
    index("form_sections_form_id_idx").on(table.formId),
    unique("form_sections_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "form_sections_organization_form_fk",
      columns: [table.organizationId, table.formId],
      foreignColumns: [FormsTable.organizationId, FormsTable.id],
    }).onDelete("cascade"),
  ],
);

export const formSectionsRelations = relations(
  FormSectionsTable,
  ({ one, many }) => ({
    organization: one(OrganizationsTable, {
      fields: [FormSectionsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    form: one(FormsTable, {
      fields: [FormSectionsTable.formId],
      references: [FormsTable.id],
    }),
    questions: many(QuestionsTable),
  }),
);

export type FormSection = typeof FormSectionsTable.$inferSelect;
export type NewFormSection = typeof FormSectionsTable.$inferInsert;
