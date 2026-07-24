import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable } from "@/drizzle/schemas/auth";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";

/**
 * Table only for now — one Google OAuth grant per org, for importing Google
 * Forms as assessments. No logic reads/writes this until Phase 7; added here
 * because it's part of the Phase 4 assessment schema slice per
 * docs/rebuild/03-data-model.md.
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
    createdAt,
    updatedAt,
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
