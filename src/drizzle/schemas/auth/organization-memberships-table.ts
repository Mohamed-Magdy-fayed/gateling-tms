import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
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
// uniqueness of a user's membership within an organization. There is no
// `isCurrent` column here — the active org is session state, not row state
// (see `sessionSchema.activeOrganizationId`, STATE.md D42/D48); a DB column
// duplicating it would just be a second source of truth to keep in sync.
export const OrganizationMembershipsTable = pgTable(
  "organization_memberships",
  {
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
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    // orgProcedure looks up "this user's membership in org X" on every
    // authenticated request — index the reverse direction of the PK.
    index("organization_memberships_user_id_idx").on(table.userId),
  ],
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
