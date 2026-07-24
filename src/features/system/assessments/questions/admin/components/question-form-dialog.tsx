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
import type { Question, QuestionType } from "@/drizzle/schema";
import { questionTypeValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type QuestionMutationInput,
  questionMutationSchema,
} from "@/features/system/assessments/questions/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type QuestionFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  question?: Question | null;
  sectionId: string;
};

export function QuestionFormDialog({
  onOpenChange,
  open,
  question,
  sectionId,
}: QuestionFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = question != null;

  const createMut = useMutation(trpc.questions.create.mutationOptions());
  const updateMut = useMutation(trpc.questions.update.mutationOptions());

  const defaultValues = useMemo<QuestionMutationInput>(
    () => ({
      sectionId,
      text: question?.text ?? "",
      type: question?.type ?? "single_choice",
      points: question?.points ?? 1,
    }),
    [sectionId, question],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: questionMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && question
          ? updateMut.mutateAsync({
              id: question.id,
              text: value.text,
              type: value.type,
              points: value.points,
            })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "questions.updated" : "questions.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("questions.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.questions.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) question, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, question?.id]);

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
            {t(isEdit ? "questions.edit" : "questions.add")}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEdit ? "questions.editDescription" : "questions.addDescription",
            )}
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
                  <field.TextareaField
                    label={t("questions.text")}
                    autoFocus
                    rows={3}
                  />
                )}
              </form.AppField>

              <div className="grid grid-cols-2 gap-4">
                <form.AppField name="type">
                  {(field) => (
                    <field.SelectField
                      label={t("questions.type")}
                      options={questionTypeValues.map((type: QuestionType) => ({
                        value: type,
                        label: t(`questions.typeOptions.${type}`),
                      }))}
                    />
                  )}
                </form.AppField>

                <form.AppField name="points">
                  {(field) => (
                    <field.NumberField label={t("questions.points")} />
                  )}
                </form.AppField>
              </div>
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
