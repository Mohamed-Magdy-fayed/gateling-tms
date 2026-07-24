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
import type { Lecture } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type LectureMutationInput,
  lectureMutationSchema,
} from "@/features/system/content-library/lectures/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type LectureFormDialogProps = {
  lecture?: Lecture | null;
  levelId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LectureFormDialog({
  lecture,
  levelId,
  onOpenChange,
  open,
}: LectureFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = lecture != null;

  const createMut = useMutation(trpc.lectures.create.mutationOptions());
  const updateMut = useMutation(trpc.lectures.update.mutationOptions());

  const defaultValues = useMemo<LectureMutationInput>(
    () => ({
      levelId,
      name: lecture?.name ?? "",
      description: lecture?.description ?? "",
      content: lecture?.content ?? "",
    }),
    [levelId, lecture],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: lectureMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && lecture
          ? updateMut.mutateAsync({
              id: lecture.id,
              name: value.name,
              description: value.description,
              content: value.content,
            })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "lectures.updated" : "lectures.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("lectures.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.lectures.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) lecture, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, lecture?.id]);

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
            {t(isEdit ? "lectures.edit" : "lectures.add")}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? "lectures.editDescription" : "lectures.addDescription")}
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
                  <field.StringField label={t("lectures.name")} autoFocus />
                )}
              </form.AppField>
              <form.AppField name="description">
                {(field) => (
                  <field.TextareaField label={t("lectures.description")} />
                )}
              </form.AppField>
              <form.AppField name="content">
                {(field) => (
                  <field.TextareaField label={t("lectures.content")} />
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
