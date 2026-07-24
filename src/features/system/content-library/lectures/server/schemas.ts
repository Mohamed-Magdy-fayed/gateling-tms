import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listLecturesInput = z.object({
  levelId: z.uuid(),
});

// Shared between create and update so the two schemas can't silently drift
// (e.g. a future length-limit change applied to one but not the other).
const lectureFields = {
  name: z
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
  content: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional()
    .or(z.literal("")),
};

export const lectureMutationSchema = z.object({
  levelId: z.uuid(),
  ...lectureFields,
});

export const lectureUpdateSchema = z.object({
  id: z.uuid(),
  ...lectureFields,
});

export const lectureDeleteSchema = z.object({
  id: z.uuid(),
});

export const lectureMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListLecturesInput = z.infer<typeof listLecturesInput>;
export type LectureMutationInput = z.infer<typeof lectureMutationSchema>;
export type LectureUpdateInput = z.infer<typeof lectureUpdateSchema>;
export type LectureDeleteInput = z.infer<typeof lectureDeleteSchema>;
export type LectureMoveInput = z.infer<typeof lectureMoveSchema>;
