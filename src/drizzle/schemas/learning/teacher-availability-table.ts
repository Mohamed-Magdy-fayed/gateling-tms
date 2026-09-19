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
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  UsersTable,
} from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";

// One recurring weekly window in which a teacher can be given a class —
// "Mondays 16:00–20:00". The same wall-clock shape as a group's schedule
// slots (groups-table.ts `GroupScheduleSlot`): a weekday plus two "HH:mm"
// times read in the organization's time zone, never concrete instants, so an
// availability declared once holds for every week the calendar shows.
//
// Rows rather than a jsonb array on the membership: the calendar reads "this
// teacher's windows" for one person at a time and the week view paints them
// as background, so a table the week query can join and filter is the natural
// shape — and it is what a future "which teacher is free at 18:00?" query
// needs, which a jsonb blob per member could only answer by loading everyone.
export const TeacherAvailabilityTable = pgTable(
  "teacher_availability",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    teacherId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    // 0 = Sunday … 6 = Saturday, matching JS `Date#getDay()` and the group
    // schedule slots, so the two can be compared without a mapping.
    day: integer().notNull(),
    startTime: varchar({ length: 5 }).notNull(), // "HH:mm", 24h
    endTime: varchar({ length: 5 }).notNull(), // "HH:mm", 24h
    createdAt,
    updatedAt,
  },
  (table) => [
    index("teacher_availability_organization_id_idx").on(table.organizationId),
    index("teacher_availability_teacher_id_idx").on(table.teacherId),
    // Availability is a property of the membership, not the user: removing
    // someone from the academy takes their windows with them, while their
    // account (and any other academy's windows for it) stays untouched.
    foreignKey({
      name: "teacher_availability_membership_fk",
      columns: [table.organizationId, table.teacherId],
      foreignColumns: [
        OrganizationMembershipsTable.organizationId,
        OrganizationMembershipsTable.userId,
      ],
    }).onDelete("cascade"),
    // The `set` mutation replaces a teacher's windows wholesale, so two
    // windows starting at the same minute on the same day can only be a bug —
    // reject it at the database rather than paint one over the other.
    unique("teacher_availability_teacher_day_start_unique").on(
      table.organizationId,
      table.teacherId,
      table.day,
      table.startTime,
    ),
  ],
);

export const teacherAvailabilityRelations = relations(
  TeacherAvailabilityTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [TeacherAvailabilityTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    teacher: one(UsersTable, {
      fields: [TeacherAvailabilityTable.teacherId],
      references: [UsersTable.id],
    }),
  }),
);

export type TeacherAvailability = typeof TeacherAvailabilityTable.$inferSelect;
export type NewTeacherAvailability =
  typeof TeacherAvailabilityTable.$inferInsert;
