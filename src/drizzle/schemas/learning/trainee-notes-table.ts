import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import { TraineesTable } from "./trainees-table";

// Free-text staff notes on a student — a call summary, a parent's request, a
// reason for a postponement. A note is a row rather than a single `notes`
// column on `trainees` so the profile reads as a dated log with an author,
// not one text box that everyone overwrites.
//
// No soft delete: a note has no children and nothing else references it, so
// removing a mistaken one is a plain delete.
export const TraineeNotesTable = pgTable(
  "trainee_notes",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    traineeId: uuid().notNull(),
    body: text().notNull(),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
  },
  (table) => [
    index("trainee_notes_organization_id_idx").on(table.organizationId),
    index("trainee_notes_trainee_id_idx").on(table.traineeId),
    unique("trainee_notes_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "trainee_notes_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
  ],
);

export const traineeNotesRelations = relations(
  TraineeNotesTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [TraineeNotesTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    trainee: one(TraineesTable, {
      fields: [TraineeNotesTable.traineeId],
      references: [TraineesTable.id],
    }),
  }),
);

export type TraineeNote = typeof TraineeNotesTable.$inferSelect;
export type NewTraineeNote = typeof TraineeNotesTable.$inferInsert;
