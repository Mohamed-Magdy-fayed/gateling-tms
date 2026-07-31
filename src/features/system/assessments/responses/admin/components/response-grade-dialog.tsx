"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { gradeResponseSchema } from "@/features/system/assessments/responses/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type ResponseGradeDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  responseId: string | null;
};

/**
 * Lets a grader score a response by hand.
 *
 * Automatic grading refuses to guess — a short answer with no accepted
 * wordings, or one no model verdict came back for, leaves the whole response
 * ungraded rather than silently scoring it zero. This is how such a response
 * stops being stuck, so the dialog shows the short answers side by side with
 * the accepted wordings: a teacher can't grade what they can't see.
 */
export function ResponseGradeDialog({
  onOpenChange,
  open,
  responseId,
}: ResponseGradeDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const gradeMut = useMutation(trpc.responses.grade.mutationOptions());

  const { data: sheet, isLoading } = useQuery({
    ...trpc.responses.gradingSheet.queryOptions({
      responseId: responseId ?? "",
    }),
    enabled: open && responseId != null,
  });

  const defaultValues = useMemo(
    () => ({
      responseId: responseId ?? "",
      score: sheet?.score ?? 0,
    }),
    [responseId, sheet?.score],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: gradeResponseSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(gradeMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("responses.graded"),
            error: (err) =>
              err instanceof Error ? err.message : t("responses.gradeFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.responses.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) response, or once its current score has loaded
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, responseId, sheet?.score]);

  const pending = gradeMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : SaveIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("responses.gradeTitle")}</DialogTitle>
          <DialogDescription>
            {t("responses.gradeDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              {sheet && sheet.items.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  {t("responses.gradeNoShortAnswers")}
                </p>
              ) : null}

              {sheet?.items.map((item) => (
                <div
                  key={item.questionId}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-sm">
                      {item.questionText}
                    </p>
                    <Tag color="neutral">
                      {item.points} {t("questions.points")}
                    </Tag>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("responses.gradeStudentAnswer")}
                    </p>
                    <p className="whitespace-pre-wrap text-foreground text-sm">
                      {item.submittedText || t("responses.gradeNoAnswer")}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      {t("responses.gradeAcceptedAnswers")}
                    </p>
                    {item.acceptedAnswers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {t("responses.gradeNoAcceptedAnswers")}
                      </p>
                    ) : (
                      <ul className="list-disc text-foreground text-sm ps-5">
                        {item.acceptedAnswers.map((accepted) => (
                          <li key={accepted}>{accepted}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              <FieldSet disabled={pending}>
                <FieldGroup>
                  <form.AppField name="score">
                    {(field) => (
                      <field.NumberField
                        label={t("responses.gradeScore")}
                        description={t("responses.gradeOutOf", {
                          max: sheet?.maxScore ?? 0,
                        })}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </FieldSet>
            </>
          )}
        </OverlayFormBody>

        <DialogFooter>
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" />
              {t("actions.cancel")}
            </Button>
            <OverlayFormSubmitButton
              formId={formId}
              disabled={pending || isLoading}
            >
              <SubmitIcon
                className={pending ? "size-3.5 animate-spin" : "size-3.5"}
              />
              {t("actions.save")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
