import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "@/drizzle/schemas/helpers";
import { OrganizationsTable, UsersTable } from ".";

export const organizationMembershipRoleValues = [
  "admin",
  "teacher",
  "student",
] as const;
export type OrganizationMembershipRole =
  (typeof organizationMembershipRoleValues)[number];
export const organizationMembershipRoleEnum = pgEnum(
  "organization_membership_role",
  organizationMembershipRoleValues,
);

// Composite primary key on (organizationId, userId) enforces the AD-required
// uniqueness of a user's membership within an organization.
export const OrganizationMembershipsTable = pgTable(
  "organization_memberships",
  {
    isCurrent: boolean(),
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    role: organizationMembershipRoleEnum().notNull().default("student"),
    createdAt,
    updatedAt,
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.userId] })],
);

export const organizationMembershipRelations = relations(
  OrganizationMembershipsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [OrganizationMembershipsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    user: one(UsersTable, {
      fields: [OrganizationMembershipsTable.userId],
      references: [UsersTable.id],
    }),
  }),
);

export type OrganizationMembership =
  typeof OrganizationMembershipsTable.$inferSelect;
export type NewOrganizationMembership =
  typeof OrganizationMembershipsTable.$inferInsert;
