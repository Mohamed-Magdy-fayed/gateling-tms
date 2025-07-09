import { pgTable, primaryKey } from "drizzle-orm/pg-core";

export const VerificationTokensTable = pgTable(
    "verification_token",
    (d) => ({
        identifier: d.varchar({ length: 255 }).notNull(),
        token: d.varchar({ length: 255 }).notNull(),
        expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
    }),
    (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);