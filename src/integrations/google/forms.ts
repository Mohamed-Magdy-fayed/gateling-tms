import { z } from "zod";

/**
 * The slice of the Google Forms API's `forms.get` response this app reads.
 *
 * Deliberately permissive: every field but the form's own id and title is
 * optional, unknown item kinds parse to an object with none of the known keys
 * set, and unknown keys are dropped rather than rejected. Google adds question
 * kinds over time, and a form containing one the mapper doesn't recognize must
 * still import its other questions with the unknown ones listed as skipped —
 * a strict schema would turn that into a total failure.
 *
 * Modelled on SOURCE's `server/services/google/types.ts`, rewritten as Zod so
 * the payload is validated at the boundary instead of cast (`response.data as
 * GoogleForm`) and trusted.
 */

const choiceQuestionSchema = z.object({
  // RADIO/CHECKBOX/DROP_DOWN today; a future kind falls through to the
  // mapper's default rather than failing the parse.
  type: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string().optional(),
        isOther: z.boolean().optional(),
      }),
    )
    .optional(),
  shuffle: z.boolean().optional(),
});

const gradingSchema = z.object({
  pointValue: z.number().optional(),
  correctAnswers: z
    .object({
      answers: z.array(z.object({ value: z.string().optional() })).optional(),
    })
    .optional(),
});

const questionSchema = z.object({
  questionId: z.string().optional(),
  required: z.boolean().optional(),
  grading: gradingSchema.optional(),
  choiceQuestion: choiceQuestionSchema.optional(),
  textQuestion: z.object({ paragraph: z.boolean().optional() }).optional(),
  // `low`/`high` are optional like everything else here, even though Google
  // always sends them: one unexpectedly absent field must cost that one
  // question, not the whole form's parse. The mapper treats a scale with
  // either missing as a question it can't import, and says so.
  scaleQuestion: z
    .object({
      low: z.number().optional(),
      high: z.number().optional(),
      lowLabel: z.string().optional(),
      highLabel: z.string().optional(),
    })
    .optional(),
  dateQuestion: z.object({}).optional(),
  timeQuestion: z.object({}).optional(),
  fileUploadQuestion: z.object({}).optional(),
  ratingQuestion: z.object({}).optional(),
  rowQuestion: z.object({ title: z.string().optional() }).optional(),
});

const itemSchema = z.object({
  itemId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  questionItem: z.object({ question: questionSchema.optional() }).optional(),
  // A grid (multiple rows sharing one set of columns) — one Google item that
  // is really several questions. Not representable in this app's schema.
  questionGroupItem: z
    .object({ questions: z.array(questionSchema).optional() })
    .optional(),
  pageBreakItem: z.object({}).optional(),
  textItem: z.object({}).optional(),
  imageItem: z.object({}).optional(),
  videoItem: z.object({}).optional(),
});

export const googleFormSchema = z.object({
  formId: z.string().min(1),
  info: z.object({
    title: z.string(),
    documentTitle: z.string().optional(),
    description: z.string().optional(),
  }),
  settings: z
    .object({
      quizSettings: z.object({ isQuiz: z.boolean().optional() }).optional(),
    })
    .optional(),
  items: z.array(itemSchema).optional(),
});

export type GoogleForm = z.infer<typeof googleFormSchema>;
export type GoogleFormItem = z.infer<typeof itemSchema>;
export type GoogleFormQuestion = z.infer<typeof questionSchema>;
