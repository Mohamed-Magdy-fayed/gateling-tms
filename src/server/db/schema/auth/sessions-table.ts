import { UsersTable } from "@/server/db/schema/users-table";
import { relations } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

export const SessionsTable = pgTable(
    "session",
    (d) => ({
        sessionToken: d.varchar({ length: 256 }).notNull().primaryKey(),
        userId: d
            .uuid()
            .notNull()
            .references(() => UsersTable.id, { onDelete: "cascade" }),
        expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
    }),
    (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(SessionsTable, ({ one }) => ({
    user: one(UsersTable, { fields: [SessionsTable.userId], references: [UsersTable.id] }),
}));
