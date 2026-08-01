import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  AnswersTable,
  FormBlocksTable,
  FormSectionsTable,
  FormsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import { assertAttachmentChain } from "@/features/system/assessments/forms/server/mutations";
import {
  extractGoogleFormId,
  type FormIdError,
  type MappedForm,
  mapGoogleForm,
} from "@/features/system/assessments/google-import/lib";
import { fetchGoogleForm, GoogleApiError } from "@/integrations/google";
import { inngest } from "@/integrations/inngest/client";
import { formMediaImportedEvent } from "@/integrations/inngest/functions/on-form-media-imported";
import {
  googleFormReadRatelimit,
  isRateLimited,
} from "@/integrations/ratelimit";
import { GoogleNotConfiguredError } from "./config";
import { recordGoogleIntegrationFailure } from "./mutations";
import type { GoogleFormImportInput, GoogleFormPreviewInput } from "./schemas";
import { GoogleNotConnectedError, getValidGoogleAccessToken } from "./tokens";
import type { OrgTRPCContext } from "./types";

const FORM_ID_ERROR_KEY = {
  empty: "googleImport.errors.invalidLink",
  responseLink: "googleImport.errors.responseLink",
  unrecognized: "googleImport.errors.invalidLink",
} as const satisfies Record<FormIdError, string>;

/**
 * Reads the form and shows what an import would produce — sections, questions,
 * and everything that wouldn't come across. Writes nothing, so an admin can
 * look before committing (phase-07.md step 5).
 */
export async function previewGoogleForm(
  ctx: OrgTRPCContext,
  input: GoogleFormPreviewInput,
): Promise<MappedForm> {
  return mapGoogleForm(await loadForm(ctx, input.formLink));
}

/**
 * Creates the assessment from the Google form, as a draft.
 *
 * Re-fetches and re-maps server-side rather than accepting the structure the
 * preview returned: the client is free to have edited it, and the only shape
 * this should ever write is the one Google actually holds. One transaction, so
 * a form never lands half-built.
 */
export async function importGoogleForm(
  ctx: OrgTRPCContext,
  input: GoogleFormImportInput,
) {
  await assertAttachmentChain(ctx, input);

  const mapped = mapGoogleForm(await loadForm(ctx, input.formLink));

  // Content counts as importable now that blocks exist: a form that is nothing
  // but a passage and a video is the reading material a later assessment asks
  // about, and refusing it would send the admin to retype it by hand. Only a
  // form that maps to *nothing* is rejected.
  if (mapped.questionCount + mapped.blockCount === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("googleImport.errors.nothingToImport"),
    });
  }

  const { organizationId } = ctx;
  const formId = crypto.randomUUID();

  // Ids are generated here rather than read back from `returning()`: the
  // children of every level are inserted in one statement each, and matching
  // them up by the order rows come back in would be an assumption about
  // Postgres rather than something guaranteed.
  const sections = mapped.sections.map((section) => ({
    id: crypto.randomUUID(),
    section,
  }));

  await ctx.db.transaction(async (trx) => {
    await trx.insert(FormsTable).values({
      id: formId,
      organizationId,
      type: input.type,
      // Always a draft: an imported assessment goes to the builder for
      // touch-ups first, never straight in front of students.
      status: "draft",
      title: input.titleOverride?.trim() || mapped.title,
      description: mapped.description,
      courseId: input.courseId,
      levelId: input.levelId,
      lectureId: input.lectureId,
    });

    await trx.insert(FormSectionsTable).values(
      sections.map(({ id, section }) => ({
        id,
        organizationId,
        formId,
        title: section.title,
        order: section.order,
      })),
    );

    const questions = sections.flatMap(({ id: sectionId, section }) =>
      section.items
        .filter((item) => item.kind === "question")
        .map((question) => ({
          id: crypto.randomUUID(),
          sectionId,
          question,
        })),
    );

    await trx.insert(QuestionsTable).values(
      questions.map(({ id, sectionId, question }) => ({
        id,
        organizationId,
        sectionId,
        text: question.text,
        description: question.description,
        type: question.type,
        points: question.points,
        isRequired: question.isRequired,
        imageSourceUrl: question.imageSourceUrl,
        imageAlt: question.imageAlt,
        order: question.order,
      })),
    );

    const blocks = sections.flatMap(({ id: sectionId, section }) =>
      section.items
        .filter((item) => item.kind === "block")
        .map((block) => ({
          organizationId,
          sectionId,
          kind: block.blockKind,
          title: block.title,
          body: block.body,
          mediaUrl: block.mediaUrl,
          sourceUrl: block.sourceUrl,
          mediaAlt: block.mediaAlt,
          order: block.order,
        })),
    );

    // A form of nothing but questions has no blocks at all, and an empty
    // VALUES list is a syntax error. Same for the answers below.
    if (blocks.length > 0) await trx.insert(FormBlocksTable).values(blocks);

    const answers = questions.flatMap(({ id: questionId, question }) =>
      question.answers.map((answer) => ({
        organizationId,
        questionId,
        text: answer.text,
        isCorrect: answer.isCorrect,
        order: answer.order,
      })),
    );

    if (answers.length > 0) await trx.insert(AnswersTable).values(answers);
  });

  await requestMediaCopy(organizationId, formId, mapped);

  return {
    id: formId,
    questionCount: mapped.questionCount,
    blockCount: mapped.blockCount,
  };
}

/**
 * Asks the media job to copy the form's images out of Google's temporary URLs.
 *
 * Sent after the transaction commits, never inside it: the handler reads the
 * rows it is meant to work on, and an uncommitted transaction has none.
 *
 * Deliberately not fatal. The assessment is already written and usable — only
 * its pictures are outstanding, and the answer sheet says as much — so a queue
 * that can't be reached must not turn a successful import into an error the
 * admin has to redo. Unlike group sessions (D163), there is no inline fallback
 * worth having: copying a dozen images through two external services is the
 * exact work an admin shouldn't be made to wait on, and re-importing the form
 * is a real recovery path.
 */
async function requestMediaCopy(
  organizationId: string,
  formId: string,
  mapped: MappedForm,
) {
  const hasPendingMedia = mapped.sections.some((section) =>
    section.items.some((item) =>
      item.kind === "block" ? item.sourceUrl : item.imageSourceUrl,
    ),
  );

  if (!hasPendingMedia) return;

  try {
    await inngest.send(
      formMediaImportedEvent.create({ organizationId, formId }),
    );
  } catch (error) {
    console.error("Failed to enqueue assessment/form-media-imported event", {
      organizationId,
      formId,
      error,
    });
  }
}

/** Shared by both paths so they can never disagree about what they accept. */
async function loadForm(ctx: OrgTRPCContext, formLink: string) {
  const parsed = extractGoogleFormId(formLink);
  if (!parsed.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t(FORM_ID_ERROR_KEY[parsed.reason]),
    });
  }

  // Checked after the link is understood, so a typo doesn't spend budget —
  // and before the token work, so a rate-limited caller never reaches Google.
  if (await isRateLimited(googleFormReadRatelimit, ctx.organizationId)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: ctx.t("googleImport.errors.rateLimited"),
    });
  }

  const accessToken = await resolveAccessToken(ctx);

  try {
    return await fetchGoogleForm(accessToken, parsed.formId);
  } catch (error) {
    throw await translateGoogleError(ctx, error);
  }
}

async function resolveAccessToken(ctx: OrgTRPCContext): Promise<string> {
  try {
    return await getValidGoogleAccessToken(ctx.organizationId);
  } catch (error) {
    if (error instanceof GoogleNotConnectedError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: ctx.t("googleImport.errors.notConnected"),
      });
    }
    if (error instanceof GoogleNotConfiguredError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: ctx.t("googleImport.errors.notConfigured"),
      });
    }
    // A refused refresh has already marked the integration `error` with its
    // reason (tokens.ts), so the connection card explains itself.
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: ctx.t("googleImport.errors.reconnect"),
    });
  }
}

/**
 * Google's own message never reaches the client — it is written for a
 * developer, and on 401/403 it would describe the grant rather than the form.
 * Each status maps to the one thing the admin can actually do about it.
 */
async function translateGoogleError(ctx: OrgTRPCContext, error: unknown) {
  if (!(error instanceof GoogleApiError)) {
    console.error("Google Forms request failed", error);
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: ctx.t("googleImport.errors.fetchFailed"),
    });
  }

  if (error.status === 401 || error.status === 403) {
    // The grant itself is the problem — record it so the connection card
    // stops claiming everything is fine.
    await recordGoogleIntegrationFailure({
      organizationId: ctx.organizationId,
      error,
    });
    return new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("googleImport.errors.formForbidden"),
    });
  }

  if (error.status === 404) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("googleImport.errors.formNotFound"),
    });
  }

  console.error("Google Forms request failed", error);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: ctx.t("googleImport.errors.fetchFailed"),
  });
}
