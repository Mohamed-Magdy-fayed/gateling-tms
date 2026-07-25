"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
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
import type { Answer } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { answerMutationSchema } from "@/features/system/assessments/answers/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type AnswerFormDialogProps = {
  answer?: Answer | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  questionId: string;
};

export function AnswerFormDialog({
  answer,
  onOpenChange,
  open,
  questionId,
}: AnswerFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = answer != null;

  const createMut = useMutation(trpc.answers.create.mutationOptions());
  const updateMut = useMutation(trpc.answers.update.mutationOptions());

  const defaultValues = useMemo(
    () => ({
      questionId,
      text: answer?.text ?? "",
      isCorrect: answer?.isCorrect ?? false,
    }),
    [questionId, answer],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: answerMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && answer
          ? updateMut.mutateAsync({
              id: answer.id,
              text: value.text,
              isCorrect: value.isCorrect,
            })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "answers.updated" : "answers.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("answers.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.answers.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) answer, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, answer?.id]);

  const pending = createMut.isPending || updateMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : isEdit ? SaveIcon : PlusIcon;
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
          <DialogTitle>
            {t(isEdit ? "answers.edit" : "answers.add")}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? "answers.editDescription" : "answers.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="text">
                {(field) => (
                  <field.StringField label={t("answers.text")} autoFocus />
                )}
              </form.AppField>

              <form.AppField name="isCorrect">
                {(field) => (
                  <field.BooleanField label={t("answers.isCorrect")} />
                )}
              </form.AppField>
            </FieldGroup>
          </FieldSet>
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
            <OverlayFormSubmitButton formId={formId} disabled={pending}>
              <SubmitIcon
                className={pending ? "size-3.5 animate-spin" : "size-3.5"}
              />
              {isEdit ? t("actions.save") : t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
