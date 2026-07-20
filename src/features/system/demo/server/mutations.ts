import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { DemoItemsTable } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type {
  DemoItemDeleteInput,
  DemoItemMutationInput,
  DemoItemUpdateInput,
} from "./schemas";

export async function createDemoItem(
  ctx: TRPCContext,
  input: DemoItemMutationInput,
) {
  const [item] = await ctx.db
    .insert(DemoItemsTable)
    .values(input)
    .returning({ id: DemoItemsTable.id });

  return { id: item.id };
}

export async function updateDemoItem(
  ctx: TRPCContext,
  input: DemoItemUpdateInput,
) {
  const existing = await ctx.db.query.DemoItemsTable.findFirst({
    columns: { id: true },
    where: eq(DemoItemsTable.id, input.id),
  });

  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await ctx.db
    .update(DemoItemsTable)
    .set({ name: input.name, isActive: input.isActive })
    .where(eq(DemoItemsTable.id, input.id));

  return { updated: true };
}

export async function deleteDemoItem(
  ctx: TRPCContext,
  input: DemoItemDeleteInput,
) {
  const existing = await ctx.db.query.DemoItemsTable.findFirst({
    columns: { id: true },
    where: eq(DemoItemsTable.id, input.id),
  });

  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await ctx.db.delete(DemoItemsTable).where(eq(DemoItemsTable.id, input.id));

  return { deleted: true };
}
