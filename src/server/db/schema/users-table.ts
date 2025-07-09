import { OrganizationsTable } from "@/server/db/schema/organizations-table";
import { WebAuthnCredentialsTable } from "@/server/db/schema/webauthn/webauthn-credentials-table";
import { createdAt, id, updatedAt } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable } from "drizzle-orm/pg-core";

export const userRoles = [
    "admin",
    "member",
    "student",
    "contentOperator",
    "contentManager",
] as const
export type UserRole = (typeof userRoles)[number]
export const userRolesEnum = pgEnum(
    "user_roles",
    userRoles
)

export const userStatuses = ["active", "inactive", "suspended", "pending_verification"] as const;
export type UserStatus = (typeof userStatuses)[number];
export const userStatusesEnum = pgEnum(
    "user_statuses",
    userStatuses
);

export const UsersTable = pgTable(
    "users",
    (d) => ({
        id,
        name: d.varchar({ length: 256 }).notNull(),
        email: d.varchar({ length: 256 }).notNull().unique(),
        phone: d.varchar({ length: 256 }),
        image: d.varchar({ length: 255 }),

        emailVerified: d.timestamp("email_verified", { mode: "date" }),
        organizationId: d.varchar({ length: 256 }).notNull(),
        roles: userRolesEnum("user_roles").array().default(["member"]).notNull(),
        status: userStatusesEnum("statuses").notNull().default("pending_verification"),

        hasWebAuthn: d.boolean("has_web_authn").notNull().default(false),
        webAuthnEnabledAt: d.timestamp("web_authn_enabled_at", { mode: "date" }),

        createdAt,
        updatedAt,
    }),
    (t) => [
        index("email_idx").on(t.email),
    ],
);

export const userRelations = relations(UsersTable, ({ one, many }) => ({
    OrganizationsTable: one(OrganizationsTable, {
        fields: [UsersTable.organizationId],
        references: [OrganizationsTable.id]
    }),
    webAuthnCredentials: many(WebAuthnCredentialsTable),
}))
