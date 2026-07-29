import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
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

export const zoomClientStatusValues = [
  // Created, authorize URL handed out, Zoom hasn't called back yet.
  "pending",
  "active",
  // The last token exchange/refresh failed — `lastError` says why.
  "error",
] as const;
export type ZoomClientStatus = (typeof zoomClientStatusValues)[number];
export const zoomClientStatusEnum = pgEnum(
  "zoom_client_status",
  zoomClientStatusValues,
);

/**
 * One Zoom account connected to one organization. Multiple rows per org are
 * supported (SOURCE's model: a school with several Zoom licences spreads
 * concurrent classes across them).
 *
 * Zoom-only, unlike SOURCE's version of this table — its `isZoom` flag plus
 * `apiKey`/`apiSecret`/`accountId`/`roomCode` columns carried a second
 * provider (On-Meeting) that the product promises nothing about
 * (STATE.md D95).
 *
 * `accessToken`/`refreshToken` hold AES-256-GCM ciphertext, never the raw
 * credential — see integrations/zoom/token-crypto.ts.
 */
export const ZoomClientsTable = pgTable(
  "zoom_clients",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 256 }).notNull(),
    status: zoomClientStatusEnum().notNull().default("pending"),
    // Identifies the Zoom account that actually authorized, so the UI can
    // show which one is connected and a second connect attempt for the same
    // account is recognizable.
    zoomUserId: varchar({ length: 256 }),
    zoomAccountId: varchar({ length: 256 }),
    zoomEmail: varchar({ length: 256 }),
    accessToken: varchar(),
    refreshToken: varchar(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    lastError: varchar({ length: 512 }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    deletedAt,
    deletedBy,
  },
  (table) => [
    index("zoom_clients_organization_id_idx").on(table.organizationId),
    index("zoom_clients_status_idx").on(table.status),
    // Lets sessions hang a composite (organizationId, zoomClientId) FK off
    // this pair in the meeting-linking segment, so a session can never point
    // at another org's Zoom account.
    unique("zoom_clients_organization_id_id_unique").on(
      table.organizationId,
      table.id,
    ),
  ],
);

export const zoomClientsRelations = relations(ZoomClientsTable, ({ one }) => ({
  organization: one(OrganizationsTable, {
    fields: [ZoomClientsTable.organizationId],
    references: [OrganizationsTable.id],
  }),
}));

export type ZoomClient = typeof ZoomClientsTable.$inferSelect;
export type NewZoomClient = typeof ZoomClientsTable.$inferInsert;
