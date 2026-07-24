import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  CoursesTable,
  FormsTable,
  LecturesTable,
  LevelsTable,
} from "@/drizzle/schema";
import type {
  FormDeleteInput,
  FormMutationInput,
  FormUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * A form's course/level/lecture attachment is a chain, not three independent
 * pointers — a level must actually belong to the given course, and a lecture
 * to the given level. The composite FKs on `forms` only check that each id
 * belongs to *some* row in the caller's org, not that they belong to *each
 * other*, so that chain has to be verified here.
 */
async function assertAttachmentChain(
  ctx: OrgTRPCContext,
  input: Pick<FormMutationInput, "courseId" | "levelId" | "lectureId">,
) {
  if (input.courseId) {
    const course = await ctx.db.query.CoursesTable.findFirst({
      where: and(
        eq(CoursesTable.id, input.courseId),
        eq(CoursesTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true },
    });
    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }
  }

  if (input.levelId) {
    const level = await ctx.db.query.LevelsTable.findFirst({
      where: and(
        eq(LevelsTable.id, input.levelId),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, courseId: true },
    });
    if (!level || level.courseId !== input.courseId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }
  }

  if (input.lectureId) {
    const lecture = await ctx.db.query.LecturesTable.findFirst({
      where: and(
        eq(LecturesTable.id, input.lectureId),
        eq(LecturesTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, levelId: true },
    });
    if (!lecture || lecture.levelId !== input.levelId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }
  }
}

export async function createForm(
  ctx: OrgTRPCContext,
  input: FormMutationInput,
) {
  await assertAttachmentChain(ctx, input);

  const [form] = await ctx.db
    .insert(FormsTable)
    .values({
      organizationId: ctx.organizationId,
      type: input.type,
      status: input.status,
      title: input.title,
      description: input.description || null,
      courseId: input.courseId,
      levelId: input.levelId,
      lectureId: input.lectureId,
    })
    .returning({ id: FormsTable.id });

  return { id: form.id };
}

export async function updateForm(ctx: OrgTRPCContext, input: FormUpdateInput) {
  await assertAttachmentChain(ctx, input);

  const [updated] = await ctx.db
    .update(FormsTable)
    .set({
      type: input.type,
      status: input.status,
      title: input.title,
      description: input.description || null,
      courseId: input.courseId,
      levelId: input.levelId,
      lectureId: input.lectureId,
    })
    .where(
      and(
        eq(FormsTable.id, input.id),
        eq(FormsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Hard delete — `form_sections`/`form_responses` both carry an
// `onDelete: "cascade"` FK back to `forms` (and `questions`/`answers`
// cascade transitively from there), so removing a form cleans up its whole
// builder tree and any responses at the database level; no app-level
// cascade logic needed here.
export async function deleteForm(ctx: OrgTRPCContext, input: FormDeleteInput) {
  const [deleted] = await ctx.db
    .delete(FormsTable)
    .where(
      and(
        eq(FormsTable.id, input.id),
        eq(FormsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
