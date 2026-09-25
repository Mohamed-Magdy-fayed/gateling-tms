import {
  jsonb,
  pgTable,
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

/**
 * One academy's override of one academy preference (design doc
 * `academy-preferences.md`). The counterpart of `settings`, but tenant-owned:
 * `settings` holds the deployment's values, this holds each academy's.
 *
 * Rows are keyed by a stable `code` from the registry
 * (`features/system/settings/lib/academy-settings-registry.ts`), which owns
 * what a code means, which control edits it and the shape of `value`. **No
 * row means the registry default applies** — resetting a preference deletes
 * its row rather than writing the default, so a later change to a default
 * reaches every academy that never chose otherwise.
 */
export const OrganizationSettingsTable = pgTable(
  "organization_settings",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    code: varchar({ length: 128 }).notNull(),
    value: jsonb().notNull(),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
  },
  (table) => [
    // The upsert target, and — through its leading column — the index behind
    // the one-query-per-academy read.
    uniqueIndex("organization_settings_organization_id_code_unique").on(
      table.organizationId,
      table.code,
    ),
  ],
);

export type OrganizationSetting = typeof OrganizationSettingsTable.$inferSelect;
export type NewOrganizationSetting =
  typeof OrganizationSettingsTable.$inferInsert;
