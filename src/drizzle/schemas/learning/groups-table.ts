import { relations, sql } from "drizzle-orm";
import {
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable, UsersTable } from "@/drizzle/schemas/auth";
import { CoursesTable } from "@/drizzle/schemas/content";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";

export type GroupScheduleSlot = {
  // 0 = Sunday … 6 = Saturday, matching JS `Date#getDay()`.
  day: number;
  startTime: string; // "HH:mm", 24h
  endTime: string; // "HH:mm", 24h
};

export const groupStatusValues = [
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;
export type GroupStatus = (typeof groupStatusValues)[number];
export const groupStatusEnum = pgEnum("group_status", groupStatusValues);

// A class. Deliberately creatable with no course attached (courseId
// nullable) — the "add students directly on the spot" instant-onboarding
// promise (docs/rebuild/phases/phase-05.md step 3) can't wait on curriculum
// existing first.
export const GroupsTable = pgTable(
  "groups",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    courseId: uuid(),
    teacherId: uuid().references(() => UsersTable.id, { onDelete: "set null" }),
    schedule: jsonb().$type<GroupScheduleSlot[]>().notNull().default([]),
    // The schedule above is an open-ended weekly pattern; these two bound it
    // into a finite set of sessions. A count rather than an end date, because
    // academies sell "a 24-session course", not "classes until March"
    // (STATE.md D80). The CURRENT_DATE default keeps the generated
    // ADD COLUMN ... NOT NULL safe on an already-populated table.
    startDate: date().notNull().default(sql`CURRENT_DATE`),
    sessionCount: integer().notNull().default(12),
    status: groupStatusEnum().notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("groups_organization_id_idx").on(table.organizationId),
    index("groups_course_id_idx").on(table.courseId),
    index("groups_teacher_id_idx").on(table.teacherId),
    unique("groups_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    // NULL courseId short-circuits this composite FK check, so "no course
    // attached" keeps working — same pattern as forms-table.ts's nullable
    // course/level/lecture attachment.
    foreignKey({
      name: "groups_organization_course_fk",
      columns: [table.organizationId, table.courseId],
      foreignColumns: [CoursesTable.organizationId, CoursesTable.id],
    }).onDelete("cascade"),
  ],
);

export const groupsRelations = relations(GroupsTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [GroupsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  course: one(CoursesTable, {
    fields: [GroupsTable.courseId],
    references: [CoursesTable.id],
  }),
  teacher: one(UsersTable, {
    fields: [GroupsTable.teacherId],
    references: [UsersTable.id],
  }),
}));

export type Group = typeof GroupsTable.$inferSelect;
export type NewGroup = typeof GroupsTable.$inferInsert;
