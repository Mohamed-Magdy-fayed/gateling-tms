import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";

export const googleIntegrationStatusValues = [
  "active",
  // The last token refresh (or an API call using it) was refused — the org's
  // admins have to reconnect, and `lastError` says why.
  "error",
] as const;
export type GoogleIntegrationStatus =
  (typeof googleIntegrationStatusValues)[number];
export const googleIntegrationStatusEnum = pgEnum(
  "google_integration_status",
  googleIntegrationStatusValues,
);

/**
 * One Google account granted to one organization, used to read that account's
 * Google Forms and import them as assessments (Phase 7 segment ③).
 *
 * A row exists only once a grant has actually succeeded — there is no
 * "pending" state, because the connect handshake keeps its only mutable state
 * in a short-lived cookie (google-import/server/connect-state.ts) rather than
 * in a half-written row. That is what lets the token columns stay `NOT NULL`.
 *
 * `accessToken`/`refreshToken` hold AES-256-GCM ciphertext, never the raw
 * credential — see integrations/oauth/token-crypto.ts. This closes the
 * plaintext gap STATE.md D64 recorded against this table when it was added
 * dormant in Phase 4.
 */
export const GoogleIntegrationsTable = pgTable(
  "google_integrations",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    accessToken: text().notNull(),
    refreshToken: text().notNull(),
    scope: varchar({ length: 512 }).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    status: googleIntegrationStatusEnum().notNull().default("active"),
    // Identifies the Google account that authorized, so the page can name it
    // and a reconnect against a different account is recognizable.
    googleEmail: varchar({ length: 256 }),
    googleUserId: varchar({ length: 256 }),
    lastError: varchar({ length: 512 }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
  },
  (table) => [
    uniqueIndex("google_integrations_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);

export const googleIntegrationsRelations = relations(
  GoogleIntegrationsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [GoogleIntegrationsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
  }),
);

export type GoogleIntegration = typeof GoogleIntegrationsTable.$inferSelect;
export type NewGoogleIntegration = typeof GoogleIntegrationsTable.$inferInsert;
