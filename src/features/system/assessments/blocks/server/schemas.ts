import { z } from "zod";
import { formBlockKindValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import { mediaUrlSchema } from "@/features/system/assessments/lib/media-url";

export const listBlocksInput = z.object({
  sectionId: z.uuid(),
});

/**
 * Shared between create and update so the two can't silently drift.
 *
 * Every optional field is `""`-or-value rather than `.optional()`, for the
 * same reason as the question fields: TanStack Form needs the validator's
 * input type to match its form values, so a cleared input has to be a legal
 * value here and is normalized to null by the mutation.
 *
 * Which fields matter depends on `kind`, and that is deliberately *not*
 * expressed as a discriminated union: the dialog lets someone switch a block
 * from image to text without losing what they typed, and a union would reject
 * the intermediate state. The mutation stores what the kind actually uses.
 */
const blockFields = {
  kind: z.enum(formBlockKindValues),
  title: z
    .string()
    .trim()
    .max(256, translationKey("forms.validation.max256")),
  body: z
    .string()
    .trim()
    .max(4000, translationKey("forms.validation.max4000")),
  mediaUrl: mediaUrlSchema,
  mediaAlt: z
    .string()
    .trim()
    .max(256, translationKey("forms.validation.max256")),
};

/**
 * A block has to carry *something*. An empty one renders as a gap the author
 * can't see and the respondent can't act on.
 *
 * `superRefine` rather than `refine` so the issue lands on the field the author
 * actually has to fill in — which depends on the kind. A fixed path would put
 * "add some text" under the body field of an image block, where there is no
 * body input to fix.
 */
function requireContent(
  value: { kind: string; title: string; body: string; mediaUrl: string },
  ctx: z.RefinementCtx,
) {
  const isText = value.kind === "text";
  const hasContent = isText
    ? Boolean(value.title || value.body)
    : Boolean(value.mediaUrl);

  if (hasContent) return;

  ctx.addIssue({
    code: "custom",
    message: translationKey("blocks.validation.empty"),
    path: [isText ? "body" : "mediaUrl"],
  });
}

export const blockMutationSchema = z
  .object({ sectionId: z.uuid(), ...blockFields })
  .superRefine(requireContent);

export const blockUpdateSchema = z
  .object({ id: z.uuid(), ...blockFields })
  .superRefine(requireContent);

export const blockDeleteSchema = z.object({
  id: z.uuid(),
});

export const blockMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListBlocksInput = z.infer<typeof listBlocksInput>;
export type BlockMutationInput = z.infer<typeof blockMutationSchema>;
export type BlockUpdateInput = z.infer<typeof blockUpdateSchema>;
export type BlockDeleteInput = z.infer<typeof blockDeleteSchema>;
export type BlockMoveInput = z.infer<typeof blockMoveSchema>;
