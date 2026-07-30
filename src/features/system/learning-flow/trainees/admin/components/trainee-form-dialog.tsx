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
import type { Trainee } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type TraineeMutationInput,
  traineeMutationSchema,
} from "@/features/system/learning-flow/trainees/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type TraineeFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  trainee?: Trainee | null;
};

export function TraineeFormDialog({
  onOpenChange,
  open,
  trainee,
}: TraineeFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = trainee != null;

  const createMut = useMutation(trpc.trainees.create.mutationOptions());
  const updateMut = useMutation(trpc.trainees.update.mutationOptions());

  const defaultValues = useMemo<TraineeMutationInput>(
    () => ({
      name: trainee?.name ?? "",
      phone: trainee?.phone ?? "",
      email: trainee?.email ?? "",
    }),
    [trainee],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: traineeMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && trainee
          ? updateMut.mutateAsync({ id: trainee.id, ...value })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "trainees.updated" : "trainees.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("trainees.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.trainees.pathKey(),
        });
        // The student counter moved, so the plan meters and the limit notice
        // are now describing the wrong number.
        await queryClient.invalidateQueries({
          queryKey: trpc.organizations.usage.queryKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) trainee, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, trainee?.id]);

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
            {t(isEdit ? "trainees.edit" : "trainees.add")}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? "trainees.editDescription" : "trainees.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.StringField label={t("trainees.name")} autoFocus />
                )}
              </form.AppField>

              <form.AppField name="phone">
                {(field) => <field.StringField label={t("trainees.phone")} />}
              </form.AppField>

              <form.AppField name="email">
                {(field) => <field.EmailField label={t("trainees.email")} />}
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
