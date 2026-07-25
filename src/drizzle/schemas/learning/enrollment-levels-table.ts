import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { LevelsTable } from "@/drizzle/schemas/content";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { EnrollmentsTable } from "./enrollments-table";

export const enrollmentLevelStatusValues = [
  "notStarted",
  "inProgress",
  "completed",
] as const;
export type EnrollmentLevelStatus =
  (typeof enrollmentLevelStatusValues)[number];
export const enrollmentLevelStatusEnum = pgEnum(
  "enrollment_level_status",
  enrollmentLevelStatusValues,
);

// Per-level progress within an enrollment.
export const EnrollmentLevelsTable = pgTable(
  "enrollment_levels",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid().notNull(),
    levelId: uuid().notNull(),
    status: enrollmentLevelStatusEnum().notNull().default("notStarted"),
    completedAt: timestamp({ withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("enrollment_levels_organization_id_idx").on(table.organizationId),
    index("enrollment_levels_enrollment_id_idx").on(table.enrollmentId),
    unique("enrollment_levels_enrollment_id_level_id_unique").on(
      table.enrollmentId,
      table.levelId,
    ),
    foreignKey({
      name: "enrollment_levels_organization_enrollment_fk",
      columns: [table.organizationId, table.enrollmentId],
      foreignColumns: [EnrollmentsTable.organizationId, EnrollmentsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "enrollment_levels_organization_level_fk",
      columns: [table.organizationId, table.levelId],
      foreignColumns: [LevelsTable.organizationId, LevelsTable.id],
    }).onDelete("cascade"),
  ],
);

export const enrollmentLevelsRelations = relations(
  EnrollmentLevelsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [EnrollmentLevelsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    enrollment: one(EnrollmentsTable, {
      fields: [EnrollmentLevelsTable.enrollmentId],
      references: [EnrollmentsTable.id],
    }),
    level: one(LevelsTable, {
      fields: [EnrollmentLevelsTable.levelId],
      references: [LevelsTable.id],
    }),
  }),
);

export type EnrollmentLevel = typeof EnrollmentLevelsTable.$inferSelect;
export type NewEnrollmentLevel = typeof EnrollmentLevelsTable.$inferInsert;
