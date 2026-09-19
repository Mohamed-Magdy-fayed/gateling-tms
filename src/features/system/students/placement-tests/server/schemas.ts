import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";

export const listPlacementTestsInput = z.object({
  traineeId: idSchema,
});

export const placementTestMutationSchema = z.object({
  traineeId: z.uuid(translationKey("forms.validation.required")),
  formId: z.uuid(translationKey("forms.validation.required")),
  // An academy often books the sitting before the trainee shows up; leaving it
  // unset just means "whenever".
  scheduledAt: z.iso.datetime().nullable(),
});

/**
 * The answers a staff member transcribes on the trainee's behalf. Same shape
 * as the assessments `submitResponseSchema`, because the same scorer consumes
 * it — trainees have no accounts (STATE.md D77), so the response is recorded
 * under the staff member who administered the test.
 */
export const placementTestAttemptSchema = z.object({
  id: z.uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.uuid(),
        selectedAnswerIds: z.array(z.uuid()).optional(),
        text: z
          .string()
          .trim()
          .max(2000, translationKey("forms.validation.max2000"))
          .optional(),
      }),
    )
    .min(1, translationKey("placementTests.unanswered")),
});

export const placementTestReviewSchema = z.object({
  id: z.uuid(),
  assignedLevelId: z.uuid(translationKey("forms.validation.required")),
  feedback: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional()
    .or(z.literal("")),
});

export const placementTestDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListPlacementTestsInput = z.infer<typeof listPlacementTestsInput>;
export type PlacementTestMutationInput = z.infer<
  typeof placementTestMutationSchema
>;
export type PlacementTestAttemptInput = z.infer<
  typeof placementTestAttemptSchema
>;
export type PlacementTestReviewInput = z.infer<
  typeof placementTestReviewSchema
>;
export type PlacementTestDeleteInput = z.infer<
  typeof placementTestDeleteSchema
>;
