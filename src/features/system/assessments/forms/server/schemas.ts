import { z } from "zod";
import { formStatusValues, formTypeValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";

export const listFormsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

// A nullable-uuid-or-empty-string triplet — the create dialog's selects use
// "" for "not attached", and courseId/levelId/lectureId all stay optional
// since a form (e.g. a placement test) can stand alone.
const attachmentField = z
  .uuid()
  .optional()
  .or(z.literal(""))
  .nullable()
  .transform((val) => (val ? val : null));

const formFields = {
  type: z.enum(formTypeValues),
  status: z.enum(formStatusValues),
  title: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  description: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional()
    .or(z.literal("")),
  courseId: attachmentField,
  levelId: attachmentField,
  lectureId: attachmentField,
};

// A level can only be picked once its course is; a lecture only once its
// level is — mirrors the cascading selects in the create/edit dialog so a
// client that bypasses the UI (or a stale form) can't submit a lecture
// attached to no level, etc.
function refineAttachmentChain<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (val) => {
      const { courseId, levelId, lectureId } = val as {
        courseId: string | null;
        levelId: string | null;
        lectureId: string | null;
      };
      if (levelId && !courseId) return false;
      if (lectureId && !levelId) return false;
      return true;
    },
    { message: translationKey("forms.validation.required"), path: ["levelId"] },
  );
}

export const formMutationSchema = refineAttachmentChain(z.object(formFields));

export const formUpdateSchema = refineAttachmentChain(
  z.object({ id: z.uuid(), ...formFields }),
);

export const formDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListFormsInput = z.infer<typeof listFormsInput>;
export type FormMutationInput = z.infer<typeof formMutationSchema>;
export type FormUpdateInput = z.infer<typeof formUpdateSchema>;
export type FormDeleteInput = z.infer<typeof formDeleteSchema>;
