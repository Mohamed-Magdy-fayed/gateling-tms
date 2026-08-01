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

/**
 * An image anywhere on a form. `contentUri` is a signed, short-lived download
 * URL — Google's own docs call it temporary — which is why an imported image
 * is copied into this app's own storage rather than hot-linked.
 */
const imageSchema = z.object({
  contentUri: z.string().optional(),
  altText: z.string().optional(),
  /** Where the author originally got it. Informational; never fetched. */
  sourceUri: z.string().optional(),
});

const choiceQuestionSchema = z.object({
  // RADIO/CHECKBOX/DROP_DOWN today; a future kind falls through to the
  // mapper's default rather than failing the parse.
  type: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string().optional(),
        isOther: z.boolean().optional(),
        // Parsed so the mapper can *say* an option had a picture attached.
        // There is nowhere to put a per-option image, and dropping one
        // silently is the thing this schema exists to prevent.
        image: imageSchema.optional(),
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
  // Per-question feedback. Parsed only so the mapper can note that it exists —
  // this app has no place to show it.
  whenRight: z.object({}).optional(),
  whenWrong: z.object({}).optional(),
  generalFeedback: z.object({}).optional(),
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
  dateQuestion: z
    .object({
      includeTime: z.boolean().optional(),
      includeYear: z.boolean().optional(),
    })
    .optional(),
  timeQuestion: z.object({ duration: z.boolean().optional() }).optional(),
  fileUploadQuestion: z.object({}).optional(),
  /** Stars/hearts out of `ratingScaleLevel` — a choice among fixed steps. */
  ratingQuestion: z
    .object({
      ratingScaleLevel: z.number().optional(),
      iconType: z.string().optional(),
    })
    .optional(),
  /** One row of a grid. Its columns live on the group's `grid`. */
  rowQuestion: z.object({ title: z.string().optional() }).optional(),
});

const itemSchema = z.object({
  itemId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  questionItem: z
    .object({
      question: questionSchema.optional(),
      /** An image that is part of the question — a diagram to read off. */
      image: imageSchema.optional(),
    })
    .optional(),
  // A grid: several row-questions sharing one set of columns. Imported as one
  // question per row, since that is what it means.
  questionGroupItem: z
    .object({
      questions: z.array(questionSchema).optional(),
      grid: z
        .object({
          columns: choiceQuestionSchema.optional(),
          shuffleQuestions: z.boolean().optional(),
        })
        .optional(),
      image: imageSchema.optional(),
    })
    .optional(),
  pageBreakItem: z.object({}).optional(),
  // A text item carries no fields of its own — its content is the item's own
  // `title` and `description`, both parsed above.
  textItem: z.object({}).optional(),
  imageItem: z.object({ image: imageSchema.optional() }).optional(),
  videoItem: z
    .object({
      video: z
        .object({
          youtubeUri: z.string().optional(),
        })
        .optional(),
      caption: z.string().optional(),
    })
    .optional(),
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
export type GoogleFormImage = z.infer<typeof imageSchema>;
