"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import { Textarea } from "@/components/ui/textarea";
import type { Form } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type DraftAnswer = { selectedAnswerIds: string[]; text: string };

export function PreviewPanel({ form }: { form: Form }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: sections } = useQuery(
    trpc.forms.getTree.queryOptions({ id: form.id }),
  );
  const submitMut = useMutation(trpc.responses.submit.mutationOptions());

  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});

  const hasQuestions = (sections ?? []).some(
    (section) => section.questions.length > 0,
  );

  function toggleChoice(
    questionId: string,
    answerId: string,
    exclusive: boolean,
  ) {
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
  }

  function setShortAnswerText(questionId: string, text: string) {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: { selectedAnswerIds: [], text },
    }));
  }

  async function handleSubmit() {
    const answers = Object.entries(drafts)
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

    if (answers.length === 0) {
      toast.error(t("forms.validation.required"));
      return;
    }

    try {
      const result = await toast
        .promise(submitMut.mutateAsync({ formId: form.id, answers }), {
          loading: t("common.loading"),
          success: t("responses.submitSuccess"),
          error: (err) =>
            err instanceof Error ? err.message : t("responses.submitFailed"),
        })
        .unwrap();
      void result;
      setDrafts({});
      await queryClient.invalidateQueries({
        queryKey: trpc.responses.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  if (form.status !== "published") {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title={t("responses.notPublished")}
            description={t("responses.previewOnly")}
          />
        </CardContent>
      </Card>
    );
  }

  if (!hasQuestions) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title={t("responses.previewEmptyTitle")}
            description={t("responses.previewEmptyDescription")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sections
        ?.filter((section) => section.questions.length > 0)
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
                        setShortAnswerText(question.id, event.target.value)
                      }
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          htmlFor={`answer-${answer.id}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            id={`answer-${answer.id}`}
                            checked={
                              drafts[question.id]?.selectedAnswerIds.includes(
                                answer.id,
                              ) ?? false
                            }
                            onCheckedChange={() =>
                              toggleChoice(
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

      <Button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitMut.isPending}
      >
        <SendIcon className="size-3.5" />
        {t("responses.submit")}
      </Button>
    </div>
  );
}
