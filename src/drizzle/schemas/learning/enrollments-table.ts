import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { CoursesTable } from "@/drizzle/schemas/content";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { TraineesTable } from "./trainees-table";

// Trimmed from SOURCE's `students_courses` for v1 — the paid-tier payment
// states (orderCreated/orderPaid/refunded) return with the future Course
// Store module (docs/rebuild/05-roadmap.md); v1 is free-tier only.
export const enrollmentStatusValues = [
  "placementTest",
  "waiting",
  "ongoing",
  "completed",
  "cancelled",
  "postponed",
] as const;
export type EnrollmentStatus = (typeof enrollmentStatusValues)[number];
export const enrollmentStatusEnum = pgEnum(
  "enrollment_status",
  enrollmentStatusValues,
);

export const EnrollmentsTable = pgTable(
  "enrollments",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    traineeId: uuid().notNull(),
    courseId: uuid().notNull(),
    status: enrollmentStatusEnum().notNull().default("waiting"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("enrollments_organization_id_idx").on(table.organizationId),
    index("enrollments_trainee_id_idx").on(table.traineeId),
    index("enrollments_course_id_idx").on(table.courseId),
    index("enrollments_status_idx").on(table.status),
    unique("enrollments_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "enrollments_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "enrollments_organization_course_fk",
      columns: [table.organizationId, table.courseId],
      foreignColumns: [CoursesTable.organizationId, CoursesTable.id],
    }).onDelete("cascade"),
  ],
);

export const enrollmentsRelations = relations(EnrollmentsTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [EnrollmentsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  trainee: one(TraineesTable, {
    fields: [EnrollmentsTable.traineeId],
    references: [TraineesTable.id],
  }),
  course: one(CoursesTable, {
    fields: [EnrollmentsTable.courseId],
    references: [CoursesTable.id],
  }),
}));

export type Enrollment = typeof EnrollmentsTable.$inferSelect;
export type NewEnrollment = typeof EnrollmentsTable.$inferInsert;
