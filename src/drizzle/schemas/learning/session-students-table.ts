import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { OrganizationsTable, UsersTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { SessionsTable } from "./sessions-table";
import { TraineesTable } from "./trainees-table";

export const attendanceStatusValues = ["present", "absent"] as const;
export type AttendanceStatus = (typeof attendanceStatusValues)[number];
export const attendanceStatusEnum = pgEnum(
  "attendance_status",
  attendanceStatusValues,
);

// Where a record came from. A teacher's correction outranks anything Zoom
// reported — a student who dialled in on a phone, or joined under a name Zoom
// couldn't match, is still present — so `manual` rows are never overwritten by
// a later webhook.
export const attendanceSourceValues = ["zoom", "manual"] as const;
export type AttendanceSource = (typeof attendanceSourceValues)[number];
export const attendanceSourceEnum = pgEnum(
  "attendance_source",
  attendanceSourceValues,
);

// Who attended one class. Keyed on `traineeId`, not SOURCE's `studentId`
// (a users row): the roster is trainees everywhere in this app, and most
// trainees never sign in at all (STATE.md D77), so keying on users would
// leave every account-less trainee unrecordable.
//
// A row exists only once something is known about that trainee for that
// session — the attendance view is the group roster LEFT JOINed onto this
// table, so "not marked" is the absence of a row rather than a third status.
export const SessionStudentsTable = pgTable(
  "session_students",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    sessionId: uuid().notNull(),
    traineeId: uuid().notNull(),
    status: attendanceStatusEnum().notNull(),
    source: attendanceSourceEnum().notNull(),
    // First join and last leave Zoom reported, null on a manual record —
    // a teacher marking someone present is not claiming to know when.
    joinedAt: timestamp({ withTimezone: true }),
    leftAt: timestamp({ withTimezone: true }),
    // Summed across every join/leave pair, so someone who dropped and came
    // back reads as the time they were actually in the room.
    attendedMinutes: integer().notNull().default(0),
    markedBy: uuid().references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("session_students_organization_id_idx").on(table.organizationId),
    index("session_students_session_id_idx").on(table.sessionId),
    index("session_students_trainee_id_idx").on(table.traineeId),
    // One record per trainee per session — the upsert target for both the
    // webhook and the teacher's override.
    unique("session_students_session_id_trainee_id_unique").on(
      table.sessionId,
      table.traineeId,
    ),
    foreignKey({
      name: "session_students_organization_session_fk",
      columns: [table.organizationId, table.sessionId],
      foreignColumns: [SessionsTable.organizationId, SessionsTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "session_students_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
  ],
);

export const sessionStudentsRelations = relations(
  SessionStudentsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [SessionStudentsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    session: one(SessionsTable, {
      fields: [SessionStudentsTable.sessionId],
      references: [SessionsTable.id],
    }),
    trainee: one(TraineesTable, {
      fields: [SessionStudentsTable.traineeId],
      references: [TraineesTable.id],
    }),
    markedByUser: one(UsersTable, {
      fields: [SessionStudentsTable.markedBy],
      references: [UsersTable.id],
    }),
  }),
);

export type SessionStudent = typeof SessionStudentsTable.$inferSelect;
export type NewSessionStudent = typeof SessionStudentsTable.$inferInsert;
