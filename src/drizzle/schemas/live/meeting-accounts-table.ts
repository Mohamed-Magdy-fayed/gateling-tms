import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  deletedAt,
  deletedBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";

export const meetingAccountStatusValues = [
  "active",
  // The last call with these credentials failed — `lastError` says why, and
  // the org re-connects. There is no `pending`: without an OAuth round trip
  // an account is either exchanged for keys or it isn't (STATE.md D146).
  "error",
] as const;
export type MeetingAccountStatus = (typeof meetingAccountStatusValues)[number];
export const meetingAccountStatusEnum = pgEnum(
  "meeting_account_status",
  meetingAccountStatusValues,
);

/**
 * One onMeeting **room** connected to one organization.
 *
 * A row per room, not per account: a room hosts one live meeting at a time, so
 * rooms are the unit of concurrent capacity — an org running three classes at
 * once needs three rooms, and session start-up picks a free one between them
 * (STATE.md D143/D146). Connecting an account writes every room it owns.
 *
 * `apiKey`/`apiSecret` hold AES-256-GCM ciphertext, never the raw credential —
 * see integrations/oauth/token-crypto.ts. The onMeeting **password** used to
 * obtain them is not stored anywhere and has no column here by design.
 */
export const MeetingAccountsTable = pgTable(
  "meeting_accounts",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    // What the admin called this connection, suffixed with the room name so
    // several rooms from one sign-in are tellable apart in a list.
    name: varchar({ length: 256 }).notNull(),
    status: meetingAccountStatusEnum().notNull().default("active"),
    // onMeeting's own identifiers. `roomCode` is what `POST /meeting` takes.
    accountId: varchar({ length: 256 }).notNull(),
    roomCode: varchar({ length: 256 }).notNull(),
    roomName: varchar({ length: 256 }).notNull(),
    apiKey: varchar(),
    apiSecret: varchar(),
    lastError: varchar({ length: 512 }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    deletedAt,
    deletedBy,
  },
  (table) => [
    index("meeting_accounts_organization_id_idx").on(table.organizationId),
    index("meeting_accounts_status_idx").on(table.status),
    // Lets `sessions` hang a composite (organizationId, meetingAccountId) FK
    // off this pair, so a session can never point at another org's room.
    unique("meeting_accounts_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
  ],
);

export const meetingAccountsRelations = relations(
  MeetingAccountsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [MeetingAccountsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
  }),
);

export type MeetingAccount = typeof MeetingAccountsTable.$inferSelect;
export type NewMeetingAccount = typeof MeetingAccountsTable.$inferInsert;
