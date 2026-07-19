import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";
import {
  BiometricCredentialsTable,
  OrganizationMembershipsTable,
  UserCredentialsTable,
  UserOAuthAccountsTable,
  UserTokensTable,
} from "./";

/**
 * A user is global, not org-bound — organization access is decided by
 * `organization_memberships`. `parentId` supports a future student→parent
 * relationship (no UI in v1, column only).
 */
export const UsersTable = pgTable(
  "users",
  {
    id,
    email: varchar({ length: 256 }).notNull(),
    name: varchar({ length: 256 }),
    phone: varchar({ length: 16 }),
    imageUrl: varchar({ length: 512 }),
    parentId: uuid().references((): AnyPgColumn => UsersTable.id, {
      onDelete: "set null",
    }),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    lastSignInAt: timestamp({ withTimezone: true }),
    age: integer(),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    deletedAt,
    deletedBy,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_phone_unique").on(table.phone),
  ],
);

export const usersRelations = relations(UsersTable, ({ many, one }) => ({
  credentials: one(UserCredentialsTable, {
    fields: [UsersTable.id],
    references: [UserCredentialsTable.userId],
  }),
  oauthAccounts: many(UserOAuthAccountsTable),
  organizationMemberships: many(OrganizationMembershipsTable),
  tokens: many(UserTokensTable),
  biometricCredentials: many(BiometricCredentialsTable),
  parent: one(UsersTable, {
    fields: [UsersTable.parentId],
    references: [UsersTable.id],
  }),
}));

export type User = typeof UsersTable.$inferSelect;
export type NewUser = typeof UsersTable.$inferInsert;
