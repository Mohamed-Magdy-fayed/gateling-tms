import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { CoursesTable } from "@/drizzle/schemas/content";
import { createdAt, id } from "@/drizzle/schemas/helpers";
import { GroupsTable } from "./groups-table";
import { TraineesTable } from "./trainees-table";

// `title` is denormalized (not just derived from course/group at read time)
// so a certificate keeps reading correctly even if its course/group is later
// renamed or removed — onDelete is "set null" on both for the same reason:
// losing the course/group shouldn't take the certificate record with it.
export const CertificatesTable = pgTable(
  "certificates",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    traineeId: uuid().notNull(),
    courseId: uuid(),
    groupId: uuid(),
    title: varchar({ length: 256 }).notNull(),
    issuedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    fileUrl: varchar({ length: 2048 }),
    createdAt,
  },
  (table) => [
    index("certificates_organization_id_idx").on(table.organizationId),
    index("certificates_trainee_id_idx").on(table.traineeId),
    unique("certificates_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
    foreignKey({
      name: "certificates_organization_trainee_fk",
      columns: [table.organizationId, table.traineeId],
      foreignColumns: [TraineesTable.organizationId, TraineesTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "certificates_organization_course_fk",
      columns: [table.organizationId, table.courseId],
      foreignColumns: [CoursesTable.organizationId, CoursesTable.id],
    }).onDelete("set null"),
    foreignKey({
      name: "certificates_organization_group_fk",
      columns: [table.organizationId, table.groupId],
      foreignColumns: [GroupsTable.organizationId, GroupsTable.id],
    }).onDelete("set null"),
  ],
);

export const certificatesRelations = relations(
  CertificatesTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [CertificatesTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    trainee: one(TraineesTable, {
      fields: [CertificatesTable.traineeId],
      references: [TraineesTable.id],
    }),
    course: one(CoursesTable, {
      fields: [CertificatesTable.courseId],
      references: [CoursesTable.id],
    }),
    group: one(GroupsTable, {
      fields: [CertificatesTable.groupId],
      references: [GroupsTable.id],
    }),
  }),
);

export type Certificate = typeof CertificatesTable.$inferSelect;
export type NewCertificate = typeof CertificatesTable.$inferInsert;
