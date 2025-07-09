import { UsersTable } from "@/server/db/schema/users-table";
import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const AccountsTable = pgTable(
    "account",
    (d) => ({
        userId: d
            .uuid()
            .notNull()
            .references(() => UsersTable.id),
        type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
        provider: d.varchar({ length: 255 }).notNull(),
        providerAccountId: d.varchar({ length: 255 }).notNull(),
        refresh_token: d.text(),
        access_token: d.text(),
        expires_at: d.integer(),
        token_type: d.varchar({ length: 255 }),
        scope: d.varchar({ length: 255 }),
        id_token: d.text(),
        session_state: d.varchar({ length: 255 }),
    }),
    (t) => [
        primaryKey({ columns: [t.provider, t.providerAccountId] }),
        index("account_user_id_idx").on(t.userId),
    ],
);

export const accountsRelations = relations(AccountsTable, ({ one }) => ({
    user: one(UsersTable, { fields: [AccountsTable.userId], references: [UsersTable.id] }),
}));
