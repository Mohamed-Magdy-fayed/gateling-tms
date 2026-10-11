import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { OrganizationsTable } from "./organizations-table";
import { UsersTable } from "./users-table";

/**
 * A physical or online location of an academy (an `organizations` row).
 * Content (courses, assessments) and settings are academy-wide; people and
 * what happens to them — trainees, groups, classes, enrollments, payments,
 * certificates — belong to exactly one branch. See
 * docs/designs/academy-branches.md.
 */
export const BranchesTable = pgTable(
  "branches",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 128 }).notNull(),
    address: varchar({ length: 512 }),
    phone: varchar({ length: 32 }),
    isActive: boolean().notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("branches_organization_id_idx").on(table.organizationId),
    unique("branches_organization_id_name_unique").on(
      table.organizationId,
      table.name,
    ),
    // Target of every branch-scoped table's composite FK, so a row can never
    // point at another academy's branch.
    unique("branches_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
  ],
);

/**
 * Which branches a non-admin member (teacher, staff) works in. Admins need no
 * rows: they see every branch of the academy.
 */
export const OrganizationMembershipBranchesTable = pgTable(
  "organization_membership_branches",
  {
    organizationId: uuid().notNull(),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    branchId: uuid().notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.branchId] }),
    index("organization_membership_branches_branch_id_idx").on(table.branchId),
    foreignKey({
      name: "organization_membership_branches_branch_fk",
      columns: [table.organizationId, table.branchId],
      foreignColumns: [BranchesTable.organizationId, BranchesTable.id],
    }).onDelete("cascade"),
  ],
);

export const branchesRelations = relations(BranchesTable, ({ one, many }) => ({
  organization: one(OrganizationsTable, {
    fields: [BranchesTable.organizationId],
    references: [OrganizationsTable.id],
  }),
  memberships: many(OrganizationMembershipBranchesTable),
}));

export const organizationMembershipBranchesRelations = relations(
  OrganizationMembershipBranchesTable,
  ({ one }) => ({
    branch: one(BranchesTable, {
      fields: [OrganizationMembershipBranchesTable.branchId],
      references: [BranchesTable.id],
    }),
    user: one(UsersTable, {
      fields: [OrganizationMembershipBranchesTable.userId],
      references: [UsersTable.id],
    }),
  }),
);

export type Branch = typeof BranchesTable.$inferSelect;
export type NewBranch = typeof BranchesTable.$inferInsert;
