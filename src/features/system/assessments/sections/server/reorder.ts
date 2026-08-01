import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import type { Transaction } from "@/drizzle";
import {
  FormBlocksTable,
  FormSectionsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import type { OrgTRPCContext } from "./types";

/**
 * Questions and content blocks share one `order` sequence inside a section.
 *
 * That is what lets a section read "passage, question, question, diagram,
 * question" — two independent sequences could only ever render one kind after
 * the other. The cost is that neither table may allocate or swap an `order` by
 * itself, so both go through here.
 */
export type SectionItemKind = "question" | "block";

type SectionItem = {
  id: string;
  kind: SectionItemKind;
  order: number;
};

/**
 * Locks the section row for the rest of the transaction.
 *
 * Every order allocation and every swap in the section takes this lock, so two
 * concurrent creates can't observe the same `max(order)` and a create can't
 * interleave with a move — the same pattern `createQuestion` already used, now
 * shared so a question and a block can't race each other either.
 */
export async function lockSection(
  trx: Transaction,
  organizationId: string,
  sectionId: string,
) {
  const [section] = await trx
    .select({ id: FormSectionsTable.id })
    .from(FormSectionsTable)
    .where(
      and(
        eq(FormSectionsTable.id, sectionId),
        eq(FormSectionsTable.organizationId, organizationId),
      ),
    )
    .for("update");

  return section ?? null;
}

/**
 * The next free `order` in a section, across both tables.
 *
 * `max(order) + 1` rather than a count: deleting an item never renumbers its
 * surviving siblings, so a count of what remains can collide with an order
 * value a surviving row already holds.
 */
export async function nextItemOrder(
  trx: Transaction,
  sectionId: string,
): Promise<number> {
  const [[questions], [blocks]] = await Promise.all([
    trx
      .select({
        value: sql<number>`coalesce(max(${QuestionsTable.order}), -1)`,
      })
      .from(QuestionsTable)
      .where(eq(QuestionsTable.sectionId, sectionId)),
    trx
      .select({
        value: sql<number>`coalesce(max(${FormBlocksTable.order}), -1)`,
      })
      .from(FormBlocksTable)
      .where(eq(FormBlocksTable.sectionId, sectionId)),
  ]);

  return Math.max(Number(questions.value), Number(blocks.value)) + 1;
}

/** Every item in a section, both kinds, in display order. */
export async function listSectionItems(
  trx: Transaction,
  organizationId: string,
  sectionId: string,
): Promise<SectionItem[]> {
  const [questions, blocks] = await Promise.all([
    trx
      .select({ id: QuestionsTable.id, order: QuestionsTable.order })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.sectionId, sectionId),
          eq(QuestionsTable.organizationId, organizationId),
        ),
      ),
    trx
      .select({ id: FormBlocksTable.id, order: FormBlocksTable.order })
      .from(FormBlocksTable)
      .where(
        and(
          eq(FormBlocksTable.sectionId, sectionId),
          eq(FormBlocksTable.organizationId, organizationId),
        ),
      ),
  ]);

  return [
    ...questions.map((row) => ({ ...row, kind: "question" as const })),
    ...blocks.map((row) => ({ ...row, kind: "block" as const })),
  ].sort((a, b) => a.order - b.order);
}

async function writeOrder(
  trx: Transaction,
  item: SectionItem,
  order: number,
): Promise<void> {
  if (item.kind === "question") {
    await trx
      .update(QuestionsTable)
      .set({ order })
      .where(eq(QuestionsTable.id, item.id));
    return;
  }

  await trx
    .update(FormBlocksTable)
    .set({ order })
    .where(eq(FormBlocksTable.id, item.id));
}

/**
 * Which section an item belongs to — the thing that has to be known before the
 * lock can be taken, and deliberately the *only* thing read before it. The
 * item's own `order` is re-read afterwards, since a concurrent move could land
 * in between.
 */
async function findSectionId(
  ctx: OrgTRPCContext,
  trx: Transaction,
  id: string,
  kind: SectionItemKind,
): Promise<string> {
  const row =
    kind === "question"
      ? await trx.query.QuestionsTable.findFirst({
          where: and(
            eq(QuestionsTable.id, id),
            eq(QuestionsTable.organizationId, ctx.organizationId),
          ),
          columns: { sectionId: true },
        })
      : await trx.query.FormBlocksTable.findFirst({
          where: and(
            eq(FormBlocksTable.id, id),
            eq(FormBlocksTable.organizationId, ctx.organizationId),
          ),
          columns: { sectionId: true },
        });

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: ctx.t("errors.notFound") });
  }

  return row.sectionId;
}

/**
 * Moves a question or a block one place up or down among *all* the section's
 * items, whatever kind its neighbour is.
 *
 * Swaps the two `order` values rather than renumbering the list — same
 * reasoning as `moveSection`, and it keeps the write to two rows regardless of
 * how long the section is.
 */
export async function moveSectionItem(
  ctx: OrgTRPCContext,
  input: { id: string; kind: SectionItemKind; direction: "up" | "down" },
) {
  return ctx.db.transaction(async (trx) => {
    const sectionId = await findSectionId(ctx, trx, input.id, input.kind);

    if (!(await lockSection(trx, ctx.organizationId, sectionId))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // Read after the lock: the orders are only authoritative once nothing else
    // can be swapping them.
    const items = await listSectionItems(trx, ctx.organizationId, sectionId);
    const index = items.findIndex(
      (item) => item.id === input.id && item.kind === input.kind,
    );

    if (index === -1) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighborIndex = input.direction === "up" ? index - 1 : index + 1;
    // Already first/last — nothing to swap with, not an error.
    if (neighborIndex < 0 || neighborIndex >= items.length) {
      return { moved: false };
    }

    const current = items[index];
    const neighbor = items[neighborIndex];

    await writeOrder(trx, current, neighbor.order);
    await writeOrder(trx, neighbor, current.order);

    return { moved: true };
  });
}
