import { relations } from "drizzle-orm";
import {
  bigint,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";
import { OrganizationMembershipsTable, UsersTable } from ".";

export const organizationPlanValues = [
  "free",
  "basic",
  "professional",
  "enterprise",
] as const;
export type OrganizationPlan = (typeof organizationPlanValues)[number];
export const organizationPlanEnum = pgEnum(
  "organization_plan",
  organizationPlanValues,
);

export const OrganizationsTable = pgTable(
  "organizations",
  {
    id,
    shortCode: varchar({ length: 8 }).notNull(),
    name: varchar({ length: 128 }).notNull(),
    businessName: varchar({ length: 256 }),
    phone: varchar({ length: 32 }),
    website: varchar({ length: 2048 }),
    plan: organizationPlanEnum().notNull().default("free"),
    // IANA zone the org's class schedules are written in. A group's weekly
    // slots are wall-clock ("Mon 18:00"); this is what turns them into
    // concrete UTC instants. Org-wide rather than per-group — an academy
    // runs on one clock (STATE.md D80).
    timeZone: varchar({ length: 64 }).notNull().default("Africa/Cairo"),
    // Consent to appear in the public showcase band on the landing page (the
    // academy's initials and its owner's photo). Opt-in, timestamped rather
    // than boolean so it is auditable when someone asks "when did we agree to
    // this?", and clearing it un-publishes immediately. Separate from a
    // testimonial's own `isPublic`: they publish different things, so one
    // consent must not imply the other.
    publicShowcaseConsentAt: timestamp({ withTimezone: true }),
    // When the owner dismissed the dashboard prompt asking for feedback, so it
    // isn't asked again. Null means never dismissed.
    testimonialPromptDismissedAt: timestamp({ withTimezone: true }),
    studentCount: integer().notNull().default(0),
    courseCount: integer().notNull().default(0),
    storageBytes: bigint({ mode: "number" }).notNull().default(0),
    ownerId: uuid().references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("organizations_short_code_idx").on(table.shortCode)],
);

export const organizationsRelations = relations(
  OrganizationsTable,
  ({ many, one }) => ({
    memberships: many(OrganizationMembershipsTable),
    owner: one(UsersTable, {
      fields: [OrganizationsTable.ownerId],
      references: [UsersTable.id],
    }),
  }),
);

export type Organization = typeof OrganizationsTable.$inferSelect;
export type NewOrganization = typeof OrganizationsTable.$inferInsert;
