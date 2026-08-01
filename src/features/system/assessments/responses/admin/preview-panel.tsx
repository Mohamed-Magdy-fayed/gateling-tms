"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Form } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { FormAnswerSheet, useAnswerDrafts } from "./form-answer-sheet";

export function PreviewPanel({ form }: { form: Form }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: sections } = useQuery(
    trpc.forms.getTree.queryOptions({ id: form.id }),
  );
  const submitMut = useMutation(trpc.responses.submit.mutationOptions());

  const {
    drafts,
    toggleChoice,
    setTextAnswer,
    reset,
    toSubmittableAnswers,
  } = useAnswerDrafts();

  const hasQuestions = (sections ?? []).some(
    (section) => section.questions.length > 0,
  );

  async function handleSubmit() {
    const answers = toSubmittableAnswers();

    if (answers.length === 0) {
      toast.error(t("forms.validation.required"));
      return;
    }

    try {
      await toast
        .promise(submitMut.mutateAsync({ formId: form.id, answers }), {
          loading: t("common.loading"),
          success: t("responses.submitSuccess"),
          error: (err) =>
            err instanceof Error ? err.message : t("responses.submitFailed"),
        })
        .unwrap();
      reset();
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
      <FormAnswerSheet
        sections={sections ?? []}
        drafts={drafts}
        onToggleChoice={toggleChoice}
        onSetTextAnswer={setTextAnswer}
      />

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
