import { z } from "zod";
import { formTypeValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  formFieldsSchema,
  refineAttachmentChain,
} from "@/features/system/assessments/forms/server/schemas";

const formLinkField = z
  .string()
  .trim()
  .min(1, translationKey("forms.validation.required"))
  // Long enough for any Google URL, short enough that nothing pathological
  // reaches the id parser.
  .max(2048, translationKey("forms.validation.max2000"));

export const googleFormPreviewSchema = z.object({ formLink: formLinkField });

/**
 * The import's own input rather than the form dialog's: `status` is always
 * `draft` (an imported assessment is opened in the builder for touch-ups, not
 * published sight-unseen), and title/description come from Google unless the
 * admin overrides the title. The course/level/lecture triplet is reused from
 * the form schema so both paths validate an attachment the same way.
 */
export const googleFormImportSchema = refineAttachmentChain(
  formFieldsSchema
    .pick({ courseId: true, levelId: true, lectureId: true })
    .extend({
      formLink: formLinkField,
      type: z.enum(formTypeValues),
      titleOverride: z
        .string()
        .trim()
        .max(256, translationKey("forms.validation.max256"))
        .optional()
        .or(z.literal("")),
    }),
);

export type GoogleFormPreviewInput = z.infer<typeof googleFormPreviewSchema>;
export type GoogleFormImportInput = z.infer<typeof googleFormImportSchema>;
