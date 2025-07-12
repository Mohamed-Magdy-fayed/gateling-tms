import { UsersTable } from "@/server/db/schema/users-table";
import { relations } from "drizzle-orm";
import { pgTable, primaryKey } from "drizzle-orm/pg-core";

export const AuthenticatorTable = pgTable(
    "authenticator",
    (d) => ({
        credentialID: d.text("credentialID").notNull().unique(),
        userId: d.uuid("userId")
            .notNull()
            .references(() => UsersTable.id, { onDelete: "cascade" }),
        providerAccountId: d.text("providerAccountId").notNull(),
        credentialPublicKey: d.text("credentialPublicKey").notNull(),
        counter: d.integer("counter").notNull(),
        credentialDeviceType: d.text("credentialDeviceType").notNull(),
        credentialBackedUp: d.boolean("credentialBackedUp").notNull(),
        transports: d.text("transports"),
    }),
    (t) => [primaryKey({ columns: [t.userId, t.credentialID] })]
);

export const authenticatorRelations = relations(AuthenticatorTable, ({ one }) => ({
    user: one(UsersTable, {
        fields: [AuthenticatorTable.userId],
        references: [UsersTable.id],
    }),
}));
