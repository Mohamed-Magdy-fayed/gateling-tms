import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";

export const settingsLabels = ["policy", "integration"] as const;
export const settingsLabelEnum = pgEnum("settings_label", settingsLabels);
export type SettingsLabel = (typeof settingsLabels)[number];

/**
 * Deployment-wide settings — the same table every Gateling system carries
 * (gateling.com, atelier), so an operator sets up an integration the same
 * way everywhere: create it on the provider's side, paste the key into this
 * system's settings page. There is deliberately no `organizationId`: these
 * are the deployment's values, not a tenant's, which is also why the
 * org-isolation suite does not list this table.
 *
 * Rows are keyed by a stable `code` from the registry
 * (`features/system/settings/lib/system-settings-registry.ts`); the registry,
 * not the row, says what a code means, whether it is a secret, and what may
 * be edited.
 */
export const SettingsTable = pgTable(
  "settings",
  {
    id,
    code: varchar({ length: 128 }).notNull().unique(),
    label: settingsLabelEnum().notNull(),
    description: text(),
    isActive: boolean(),
    value: text(),
    amount: integer(),
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
  },
  (table) => [index("settings_code_idx").on(table.code)],
);

export type Setting = typeof SettingsTable.$inferSelect;
export type NewSetting = typeof SettingsTable.$inferInsert;
