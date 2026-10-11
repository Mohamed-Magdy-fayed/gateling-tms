import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { type Branch, BranchesTable } from "@/drizzle/schema";
import { seedIfMissing } from "../base";

/**
 * A branch of a seeded academy, looked up by its natural key (academy +
 * name). The branches migration already gave every existing academy a
 * "Main" branch, so on an existing database this is usually a skip.
 */
export async function seedBranch(
  organizationId: string,
  name: string,
): Promise<Branch> {
  return seedIfMissing({
    label: `branch "${name}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(BranchesTable)
        .where(
          and(
            eq(BranchesTable.organizationId, organizationId),
            eq(BranchesTable.name, name),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(BranchesTable)
        .values({ organizationId, name })
        .returning();
      return row;
    },
  });
}
