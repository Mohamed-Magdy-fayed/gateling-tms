import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import {
  AnswersTable,
  FormSectionsTable,
  FormsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import type { ListFormsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the form exists and belongs to the caller's org — every section/question/answer/response mutation scopes through this first so nested content can never attach to (or be read from) another org's form. */
export async function assertFormInOrg(ctx: OrgTRPCContext, formId: string) {
  const form = await ctx.db.query.FormsTable.findFirst({
    where: and(
      eq(FormsTable.id, formId),
      eq(FormsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, status: true },
  });

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return form;
}

function buildWhereClause(ctx: OrgTRPCContext, input: ListFormsInput) {
  return and(
    eq(FormsTable.organizationId, ctx.organizationId),
    input.globalFilter?.trim()
      ? ilike(FormsTable.title, `%${input.globalFilter.trim()}%`)
      : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as courses/server/queries.ts's sortExpr.
function sortExpr(input: ListFormsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) return [desc(FormsTable.createdAt), asc(FormsTable.id)];

  switch (firstSort.id) {
    case "title":
      return [
        firstSort.desc ? desc(FormsTable.title) : asc(FormsTable.title),
        asc(FormsTable.id),
      ];
    default:
      return [
        firstSort.desc ? desc(FormsTable.createdAt) : asc(FormsTable.createdAt),
        asc(FormsTable.id),
      ];
  }
}

export async function listForms(ctx: OrgTRPCContext, input: ListFormsInput) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(FormsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select()
    .from(FormsTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

export async function getForm(ctx: OrgTRPCContext, id: string) {
  const form = await ctx.db.query.FormsTable.findFirst({
    where: and(
      eq(FormsTable.id, id),
      eq(FormsTable.organizationId, ctx.organizationId),
    ),
  });

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return form;
}

// The full builder/preview tree in one round trip (sections -> questions ->
// answers, all ordered) — the preview/test-submit UI renders straight from
// this rather than issuing the same waterfall of per-level `list` calls the
// admin builder's expandable cards use, since a read-only preview needs the
// whole thing at once anyway.
export async function getFormTree(ctx: OrgTRPCContext, id: string) {
  await getForm(ctx, id);

  const sections = await ctx.db.query.FormSectionsTable.findMany({
    where: and(
      eq(FormSectionsTable.formId, id),
      eq(FormSectionsTable.organizationId, ctx.organizationId),
    ),
    orderBy: asc(FormSectionsTable.order),
    with: {
      questions: {
        orderBy: asc(QuestionsTable.order),
        with: {
          answers: {
            orderBy: asc(AnswersTable.order),
          },
        },
      },
    },
  });

  return sections;
}
