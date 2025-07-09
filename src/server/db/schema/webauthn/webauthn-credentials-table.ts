import { UsersTable } from "@/server/db/schema/users-table";
import { id, createdAt, updatedAt } from "@/server/db/schemaHelpers";
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

export const WebAuthnCredentialsTable = pgTable(
    "webauthn_credentials",
    (d) => ({
        id,
        credentialId: d.varchar("credential_id", { length: 256 }).notNull().unique(),
        publicKey: d.varchar("public_key", { length: 2048 }).notNull(), // Public key can be long
        counter: d.integer("counter").notNull().default(0),
        userId: d.varchar("user_id", { length: 256 }).notNull(),
        createdAt,
        lastUsed: d.timestamp("last_used", { mode: "date" }),
        updatedAt,
    }),
);

export const webAuthnCredentialRelations = relations(WebAuthnCredentialsTable, ({ one }) => ({
    user: one(UsersTable, {
        fields: [WebAuthnCredentialsTable.userId],
        references: [UsersTable.id],
    }),
}));
