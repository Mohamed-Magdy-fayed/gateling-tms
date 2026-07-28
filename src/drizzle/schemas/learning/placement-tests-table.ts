import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { FormsTable } from "@/drizzle/schemas/assessment";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { LevelsTable } from "@/drizzle/schemas/content";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { TraineesTable } from "./trainees-table";

export const placementTestStatusValues = [
  "pending",
  "inProgress",
  "completed",
  "cancelled",
] as const;
export type PlacementTestStatus = (typeof placementTestStatusValues)[number];
export const placementTestStatusEnum = pgEnum(
  "placement_test_status",
  placementTestStatusValues,
);

// Links a placement-type form to a trainee and records the resulting level
// once reviewed. `formId`/`assignedLevelId` are nullable — a placement test
// can be scheduled before the form or resulting level is decided.
//
// Both are deliberately plain single-column FKs, not the usual composite
// (organizationId, X) pattern (STATE.md D63) — see certificates-table.ts's
// comment / STATE.md D79 for why: a composite FK's ON DELETE SET NULL nulls
// every column it names, including the NOT NULL organizationId, which
// throws instead of nulling just the pointer. The mutation that creates a
// placement test must still verify formId/assignedLevelId belong to
// ctx.organizationId before inserting.
export const PlacementTestsTable = pgTable(
  "placement_tests",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    traineeId: uuid().notNull(),
    formId: uuid().references(() => FormsTable.id, { onDelete: "set null" }),
    assignedLevelId: uuid().references(() => LevelsTable.id, {
      onDelete: "set null",
    }),
    status: placementTestStatusEnum().notNull().default("pending"),
    feedback: text(),
    scheduledAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("placement_tests_organization_id_idx").on(table.organizationId),
    index("placement_tests_trainee_id_idx").on(table.traineeId),
    index("placement_tests_status_idx").on(table.status),
    unique("placement_tests_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "placement_tests_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
  ],
);

export const placementTestsRelations = relations(
  PlacementTestsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [PlacementTestsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    trainee: one(TraineesTable, {
      fields: [PlacementTestsTable.traineeId],
      references: [TraineesTable.id],
    }),
    form: one(FormsTable, {
      fields: [PlacementTestsTable.formId],
      references: [FormsTable.id],
    }),
    assignedLevel: one(LevelsTable, {
      fields: [PlacementTestsTable.assignedLevelId],
      references: [LevelsTable.id],
    }),
  }),
);

export type PlacementTest = typeof PlacementTestsTable.$inferSelect;
export type NewPlacementTest = typeof PlacementTestsTable.$inferInsert;
