"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Textarea } from "@/components/ui/textarea";
import type { FormBlockKind, QuestionType } from "@/drizzle/schema";
import { isTextQuestion } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

/** The shape `forms.getTree` returns, narrowed to what rendering needs. */
export type AnswerSheetQuestion = {
  id: string;
  text: string;
  description: string | null;
  type: QuestionType;
  points: number;
  order: number;
  isRequired: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  answers: { id: string; text: string }[];
};

export type AnswerSheetBlock = {
  id: string;
  kind: FormBlockKind;
  title: string | null;
  body: string | null;
  mediaUrl: string | null;
  mediaAlt: string | null;
  sourceUrl: string | null;
  order: number;
};

export type AnswerSheetSection = {
  id: string;
  title: string;
  questions: AnswerSheetQuestion[];
  blocks: AnswerSheetBlock[];
};

export type SubmittableAnswer = {
  questionId: string;
  selectedAnswerIds?: string[];
  text?: string;
};

type DraftAnswer = { selectedAnswerIds: string[]; text: string };

/** The `<input type>` each typed question uses. Long answers get a textarea. */
const TEXT_INPUT_TYPE: Partial<Record<QuestionType, "date" | "time">> = {
  date: "date",
  time: "time",
};

/**
 * In-progress answers for one pass over a form.
 *
 * Shared by the assessments Preview tab and the learning-flow placement-test
 * runner: both are a staff member filling in the same form, and the payload
 * both send has to match what the scorer expects.
 */
export function useAnswerDrafts() {
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});

  const toggleChoice = useCallback(
    (questionId: string, answerId: string, exclusive: boolean) => {
      setDrafts((prev) => {
        const current = prev[questionId]?.selectedAnswerIds ?? [];
        const isSelected = current.includes(answerId);
        const nextSelected = exclusive
          ? isSelected
            ? []
            : [answerId]
          : isSelected
            ? current.filter((id) => id !== answerId)
            : [...current, answerId];

        return {
          ...prev,
          [questionId]: { selectedAnswerIds: nextSelected, text: "" },
        };
      });
    },
    [],
  );

  /** Every typed answer — short, long, date and time all store one string. */
  const setTextAnswer = useCallback((questionId: string, text: string) => {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: { selectedAnswerIds: [], text },
    }));
  }, []);

  const reset = useCallback(() => setDrafts({}), []);

  /** Only questions that were actually answered — a blank one is left out. */
  const toSubmittableAnswers = useCallback((): SubmittableAnswer[] => {
    return Object.entries(drafts)
      .filter(
        ([, draft]) => draft.selectedAnswerIds.length > 0 || draft.text.trim(),
      )
      .map(([questionId, draft]) => ({
        questionId,
        selectedAnswerIds:
          draft.selectedAnswerIds.length > 0
            ? draft.selectedAnswerIds
            : undefined,
        text: draft.text.trim() ? draft.text.trim() : undefined,
      }));
  }, [drafts]);

  return {
    drafts,
    toggleChoice,
    setTextAnswer,
    reset,
    toSubmittableAnswers,
  };
}

function ContentBlock({ block }: { block: AnswerSheetBlock }) {
  const { t } = useTranslation();

  const heading = block.title ? (
    <p className="font-medium text-foreground text-sm">{block.title}</p>
  ) : null;

  if (block.kind === "text") {
    return (
      <div className="space-y-1">
        {heading}
        {/* Plain text in a JSX expression — React escapes it. `whitespace-pre-line`
            keeps the author's paragraph breaks without any HTML being involved. */}
        {block.body ? (
          <p className="whitespace-pre-line text-muted-foreground text-sm">
            {block.body}
          </p>
        ) : null}
      </div>
    );
  }

  // An imported image whose fetch hasn't landed yet, or one that couldn't be
  // fetched at all. Both say so rather than rendering a broken image.
  if (!block.mediaUrl) {
    return (
      <div className="space-y-1">
        {heading}
        <p className="text-muted-foreground text-xs italic">
          {t(block.sourceUrl ? "blocks.mediaPending" : "blocks.mediaFailed")}
        </p>
      </div>
    );
  }

  if (block.kind === "image") {
    return (
      <div className="space-y-1">
        {heading}
        {/* biome-ignore lint/performance/noImgElement: an arbitrary
            org-uploaded storage URL, not a build-time known asset */}
        <img
          src={block.mediaUrl}
          alt={block.mediaAlt ?? ""}
          loading="lazy"
          className="max-h-96 w-full rounded-md object-contain"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {heading}
      <div className="aspect-video w-full overflow-hidden rounded-md">
        {/* `sandbox` as well as the CSP: `frame-src` decides which origins may
            load, not what a loaded frame may then do — without this the embed
            could navigate the page it sits in. These three are the minimum
            YouTube playback needs. `allow-same-origin` is safe alongside
            `allow-scripts` only because the frame is cross-origin to us, so it
            cannot reach out and drop its own sandbox. */}
        <iframe
          src={block.mediaUrl}
          title={block.title ?? t("blocks.kindOptions.video")}
          loading="lazy"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          className="size-full"
        />
      </div>
    </div>
  );
}

/** Its own component so the suppression has somewhere to attach. */
function QuestionImage({ src, alt }: { src: string; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: an arbitrary org-uploaded storage URL, not a build-time known asset
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="max-h-72 rounded-md object-contain"
    />
  );
}

type QuestionFieldProps = {
  drafts: Record<string, DraftAnswer>;
  idPrefix: string;
  onSetTextAnswer: (questionId: string, text: string) => void;
  onToggleChoice: (
    questionId: string,
    answerId: string,
    exclusive: boolean,
  ) => void;
  question: AnswerSheetQuestion;
};

function QuestionField({
  drafts,
  idPrefix,
  onSetTextAnswer,
  onToggleChoice,
  question,
}: QuestionFieldProps) {
  const { t } = useTranslation();
  const inputType = TEXT_INPUT_TYPE[question.type];

  // A choice question labels each option through its own `<label>`. A typed
  // one has no such pairing, so the prompt (and the help text under it) are
  // named here and pointed at from the control — otherwise a screen reader
  // announces an edit field with nothing to say about it.
  const promptId = `${idPrefix}-${question.id}-prompt`;
  const descriptionId = `${idPrefix}-${question.id}-description`;
  const labelledBy = question.description
    ? `${promptId} ${descriptionId}`
    : promptId;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span id={promptId} className="font-medium text-foreground text-sm">
          {question.text}
          {/* The asterisk is decoration; `aria-required` on the control is
              what actually conveys the requirement. */}
          {question.isRequired ? (
            <span className="ms-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        <Tag color="neutral">
          {question.points} {t("questions.points")}
        </Tag>
      </div>

      {question.description ? (
        <p
          id={descriptionId}
          className="whitespace-pre-line text-muted-foreground text-xs"
        >
          {question.description}
        </p>
      ) : null}

      {question.imageUrl ? (
        <QuestionImage src={question.imageUrl} alt={question.imageAlt ?? ""} />
      ) : null}

      {isTextQuestion(question.type) ? (
        inputType ? (
          <Input
            type={inputType}
            className="max-w-48"
            aria-labelledby={labelledBy}
            aria-required={question.isRequired}
            value={drafts[question.id]?.text ?? ""}
            onChange={(event) =>
              onSetTextAnswer(question.id, event.target.value)
            }
          />
        ) : (
          <Textarea
            rows={question.type === "long_answer" ? 6 : 2}
            aria-labelledby={labelledBy}
            aria-required={question.isRequired}
            value={drafts[question.id]?.text ?? ""}
            onChange={(event) =>
              onSetTextAnswer(question.id, event.target.value)
            }
          />
        )
      ) : (
        // The options label themselves; the fieldset is what ties them to the
        // question. `aria-required` is not valid on a group, so a required
        // choice question conveys that through the prompt it points at.
        <fieldset aria-labelledby={labelledBy} className="space-y-1.5">
          {question.answers.map((answer) => (
            <label
              key={answer.id}
              htmlFor={`${idPrefix}-${answer.id}`}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                id={`${idPrefix}-${answer.id}`}
                checked={
                  drafts[question.id]?.selectedAnswerIds.includes(answer.id) ??
                  false
                }
                onCheckedChange={() =>
                  onToggleChoice(
                    question.id,
                    answer.id,
                    question.type === "single_choice",
                  )
                }
              />
              {answer.text}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}

type FormAnswerSheetProps = {
  drafts: Record<string, DraftAnswer>;
  /** Prefix for generated input ids, so two sheets on one page can't collide. */
  idPrefix?: string;
  onSetTextAnswer: (questionId: string, text: string) => void;
  onToggleChoice: (
    questionId: string,
    answerId: string,
    exclusive: boolean,
  ) => void;
  sections: AnswerSheetSection[];
};

export function FormAnswerSheet({
  drafts,
  idPrefix = "answer",
  onSetTextAnswer,
  onToggleChoice,
  sections,
}: FormAnswerSheetProps) {
  return (
    <div className="space-y-4">
      {sections
        // A section of nothing but content is still worth showing — it may be
        // the passage the next section's questions are about.
        .filter(
          (section) =>
            section.questions.length > 0 || section.blocks.length > 0,
        )
        .map((section) => {
          // Questions and blocks share one order sequence, which is what lets
          // a passage sit between the questions it belongs to.
          const items = [
            ...section.questions.map((question) => ({
              key: question.id,
              order: question.order,
              node: (
                <QuestionField
                  drafts={drafts}
                  idPrefix={idPrefix}
                  onSetTextAnswer={onSetTextAnswer}
                  onToggleChoice={onToggleChoice}
                  question={question}
                />
              ),
            })),
            ...section.blocks.map((block) => ({
              key: block.id,
              order: block.order,
              node: <ContentBlock block={block} />,
            })),
          ].sort((a, b) => a.order - b.order);

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {items.map((item) => (
                  <div key={item.key}>{item.node}</div>
                ))}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
