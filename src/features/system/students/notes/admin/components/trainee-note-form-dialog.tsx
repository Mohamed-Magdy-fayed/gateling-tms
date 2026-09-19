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
import { useTranslation } from "@/features/core/i18n/client";
import {
  type TraineeNoteMutationInput,
  traineeNoteMutationSchema,
} from "@/features/system/students/notes/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

export type EditableTraineeNote = { id: string; body: string };

type TraineeNoteFormDialogProps = {
  note?: EditableTraineeNote | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  traineeId: string;
};

export function TraineeNoteFormDialog({
  note,
  onOpenChange,
  open,
  traineeId,
}: TraineeNoteFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = note != null;

  const createMut = useMutation(trpc.traineeNotes.create.mutationOptions());
  const updateMut = useMutation(trpc.traineeNotes.update.mutationOptions());

  const defaultValues = useMemo<TraineeNoteMutationInput>(
    () => ({ traineeId, body: note?.body ?? "" }),
    [traineeId, note],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: traineeNoteMutationSchema },
    onSubmit: async ({ value }) => {
      // Widened: create and update resolve to different shapes, and only
      // the settling matters here.
      const action: Promise<unknown> =
        isEdit && note
          ? updateMut.mutateAsync({ id: note.id, body: value.body })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: isEdit
              ? t("traineeNotes.updated")
              : t("traineeNotes.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("traineeNotes.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.traineeNotes.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens or switches note, not on every identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, note?.id]);

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
            {isEdit ? t("traineeNotes.edit") : t("traineeNotes.add")}
          </DialogTitle>
          <DialogDescription>
            {t("traineeNotes.formDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="body">
                {(field) => (
                  <field.TextareaField
                    label={t("traineeNotes.body")}
                    placeholder={t("traineeNotes.bodyPlaceholder")}
                    rows={6}
                    autoFocus
                  />
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
              {isEdit ? t("actions.save") : t("traineeNotes.add")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
