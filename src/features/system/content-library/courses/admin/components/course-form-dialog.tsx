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
import type { Course } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type CourseMutationInput,
  courseMutationSchema,
} from "@/features/system/content-library/courses/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type CourseFormDialogProps = {
  course?: Course | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CourseFormDialog({
  course,
  onOpenChange,
  open,
}: CourseFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = course != null;

  const createMut = useMutation(trpc.courses.create.mutationOptions());
  const updateMut = useMutation(trpc.courses.update.mutationOptions());

  const defaultValues = useMemo<CourseMutationInput>(
    () => ({
      name: course?.name ?? "",
      description: course?.description ?? "",
      thumbnailUrl: course?.thumbnailUrl ?? "",
    }),
    [course],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: courseMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && course
          ? updateMut.mutateAsync({ id: course.id, ...value })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "courses.updated" : "courses.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("courses.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.courses.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) course, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, course?.id]);

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
            {t(isEdit ? "courses.edit" : "courses.add")}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? "courses.editDescription" : "courses.addDescription")}
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
                  <field.StringField label={t("courses.name")} autoFocus />
                )}
              </form.AppField>

              <form.AppField name="description">
                {(field) => (
                  <field.TextareaField
                    label={t("courses.description")}
                    rows={4}
                  />
                )}
              </form.AppField>

              <form.AppField name="thumbnailUrl">
                {(field) => (
                  <field.ImageField
                    label={t("courses.thumbnail")}
                    folder="courses"
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
              {isEdit ? t("actions.save") : t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
