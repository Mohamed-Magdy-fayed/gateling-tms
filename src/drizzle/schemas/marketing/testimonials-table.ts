import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { OrganizationsTable, UsersTable } from "@/drizzle/schemas/auth";
import {
  createdAt,
  createdBy,
  id,
  updatedAt,
  updatedBy,
} from "@/drizzle/schemas/helpers";

/**
 * One piece of feedback an academy owner wrote about Gateling-TMS, and the
 * permission to publish it.
 *
 * Tenant-owned (it belongs to the academy that wrote it) but, uniquely in this
 * schema, it is read by **anonymous visitors** — the public home page and
 * `/testimonials` render approved rows. That makes two independent gates
 * necessary, and both must be true before a row is ever shown:
 *
 * - `isPublic` — the author's own consent, given in the submit form. Theirs to
 *   withdraw at any time, which un-publishes the quote immediately.
 * - `approvedAt` — Gateling's moderation. Set by hand (`npm run db:studio`,
 *   see docs/deploy.md) rather than through an in-app screen, because there is
 *   no platform-owner role in this app and inventing one for a single review
 *   action isn't worth the surface (STATE.md D42's reasoning, still applies).
 *
 * Editing a testimonial clears `approvedAt` — an approval applies to the words
 * that were approved, not to the row forever.
 */
export const TestimonialsTable = pgTable(
  "testimonials",
  {
    id,
    organizationId: uuid()
      .notNull()
      .references(() => OrganizationsTable.id, { onDelete: "cascade" }),
    // Who wrote it. Nulled rather than cascaded if that user is removed: the
    // academy still stands behind the quote it published.
    authorUserId: uuid().references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    quote: varchar({ length: 1024 }).notNull(),
    // Displayed name/role, typed by the author — deliberately not derived from
    // `users.name`, so someone can publish as "Founder, BrightPath" without
    // that becoming their account name.
    authorName: varchar({ length: 128 }).notNull(),
    authorRole: varchar({ length: 128 }),
    imageUrl: varchar({ length: 512 }),
    isPublic: boolean().notNull().default(false),
    approvedAt: timestamp({ withTimezone: true }),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
  },
  (table) => [
    // One per academy. An academy has one thing to say about the product at a
    // time; allowing many would turn the public page into a feed one tenant
    // could dominate, and gives the submit form an unambiguous upsert target.
    uniqueIndex("testimonials_organization_id_unique").on(table.organizationId),
    // The public read is "approved and consented, newest first" — this is the
    // index that serves it.
    index("testimonials_approved_at_idx").on(table.approvedAt),
  ],
);

export const testimonialsRelations = relations(
  TestimonialsTable,
  ({ one }) => ({
    organization: one(OrganizationsTable, {
      fields: [TestimonialsTable.organizationId],
      references: [OrganizationsTable.id],
    }),
    author: one(UsersTable, {
      fields: [TestimonialsTable.authorUserId],
      references: [UsersTable.id],
    }),
  }),
);

export type Testimonial = typeof TestimonialsTable.$inferSelect;
export type NewTestimonial = typeof TestimonialsTable.$inferInsert;
