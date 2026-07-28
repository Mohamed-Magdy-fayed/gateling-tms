"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "@/components/ui/tag";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionType } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

/** The shape `forms.getTree` returns, narrowed to what rendering needs. */
export type AnswerSheetSection = {
  id: string;
  title: string;
  questions: {
    id: string;
    text: string;
    type: QuestionType;
    points: number;
    answers: { id: string; text: string }[];
  }[];
};

export type SubmittableAnswer = {
  questionId: string;
  selectedAnswerIds?: string[];
  text?: string;
};

type DraftAnswer = { selectedAnswerIds: string[]; text: string };

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

  const setShortAnswerText = useCallback((questionId: string, text: string) => {
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
    setShortAnswerText,
    reset,
    toSubmittableAnswers,
  };
}

type FormAnswerSheetProps = {
  drafts: Record<string, DraftAnswer>;
  /** Prefix for generated input ids, so two sheets on one page can't collide. */
  idPrefix?: string;
  onSetShortAnswerText: (questionId: string, text: string) => void;
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
  onSetShortAnswerText,
  onToggleChoice,
  sections,
}: FormAnswerSheetProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {sections
        .filter((section) => section.questions.length > 0)
        .map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {section.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {question.text}
                    </span>
                    <Tag color="neutral">
                      {question.points} {t("questions.points")}
                    </Tag>
                  </div>

                  {question.type === "short_answer" ? (
                    <Textarea
                      rows={2}
                      value={drafts[question.id]?.text ?? ""}
                      onChange={(event) =>
                        onSetShortAnswerText(question.id, event.target.value)
                      }
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          htmlFor={`${idPrefix}-${answer.id}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            id={`${idPrefix}-${answer.id}`}
                            checked={
                              drafts[question.id]?.selectedAnswerIds.includes(
                                answer.id,
                              ) ?? false
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
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
