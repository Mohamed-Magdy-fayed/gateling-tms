import { boolean, pgTable, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/drizzle/schemas/helpers";

/**
 * Temporary acceptance-test entity for Phase 1 (data table + forms + tRPC
 * end to end). Org-less on purpose — tenancy lands in Phase 2. Drop this
 * table (new migration) at the start of Phase 4, or repurpose into courses.
 * See docs/rebuild/phases/phase-01.md step 10.
 */
export const DemoItemsTable = pgTable("demo_items", {
  id,
  name: varchar({ length: 128 }).notNull(),
  isActive: boolean().notNull().default(true),
  createdAt,
  updatedAt,
});

export type DemoItem = typeof DemoItemsTable.$inferSelect;
export type NewDemoItem = typeof DemoItemsTable.$inferInsert;
