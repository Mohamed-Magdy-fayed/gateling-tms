"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
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
import {
  type EnrollmentStatus,
  enrollmentStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type EnrollmentMutationInput,
  enrollmentMutationSchema,
} from "@/features/system/learning-flow/enrollments/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type EnrollmentFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSaved?: (enrollmentId: string) => void;
  open: boolean;
  /** Pre-selected and locked when opened from a trainee's own page. */
  traineeId?: string;
};

// An enrollment is only ever created, never edited — trainee and course are its
// identity, and its status moves through EnrollmentStatusDialog instead.
export function EnrollmentFormDialog({
  onOpenChange,
  onSaved,
  open,
  traineeId,
}: EnrollmentFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMut = useMutation(trpc.enrollments.create.mutationOptions());

  // Only fetched while the dialog is open — neither list is on the critical
  // path of opening the form.
  const { data: trainees } = useQuery({
    ...trpc.trainees.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
    enabled: open && !traineeId,
  });
  const { data: courses } = useQuery({
    ...trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
    enabled: open,
  });

  const defaultValues = useMemo<EnrollmentMutationInput>(
    () => ({
      traineeId: traineeId ?? "",
      courseId: "",
      status: "waiting",
    }),
    [traineeId],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: enrollmentMutationSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await toast
          .promise(createMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("enrollments.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("enrollments.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.enrollments.pathKey(),
        });
        onSaved?.(result.id);
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, traineeId]);

  const pending = createMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : PlusIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const traineeOptions = useMemo(
    () =>
      (trainees?.rows ?? []).map((trainee) => ({
        value: trainee.id,
        label: trainee.name,
      })),
    [trainees],
  );

  const courseOptions = useMemo(
    () =>
      (courses?.rows ?? []).map((course) => ({
        value: course.id,
        label: course.name,
      })),
    [courses],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("enrollments.add")}</DialogTitle>
          <DialogDescription>
            {t("enrollments.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              {/* Hidden rather than rendered read-only when the dialog is
                  opened from a trainee's own page: the field is already
                  answered by where the user clicked. */}
              {!traineeId && (
                <form.AppField name="traineeId">
                  {(field) => (
                    <field.SelectField
                      label={t("enrollments.trainee")}
                      options={traineeOptions}
                    />
                  )}
                </form.AppField>
              )}

              <form.AppField name="courseId">
                {(field) => (
                  <field.SelectField
                    label={t("enrollments.course")}
                    options={courseOptions}
                  />
                )}
              </form.AppField>

              <form.AppField name="status">
                {(field) => (
                  <field.SelectField
                    label={t("enrollments.status")}
                    options={enrollmentStatusValues.map(
                      (status: EnrollmentStatus) => ({
                        value: status,
                        label: t(`enrollments.statusOptions.${status}`),
                      }),
                    )}
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
              {t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
