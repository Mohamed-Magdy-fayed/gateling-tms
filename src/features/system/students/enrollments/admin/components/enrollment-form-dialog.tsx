"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2Icon,
  PlusIcon,
  UserRoundSearchIcon,
  XIcon,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldDescription, FieldGroup, FieldSet } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  type EnrollmentStatus,
  enrollmentStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type EnrollmentMutationInput,
  type EnrollmentTraineeMode,
  enrollmentMutationSchema,
  enrollmentTraineeModeValues,
} from "@/features/system/students/enrollments/server/schemas";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTRPC } from "@/integrations/trpc/client";

type EnrollmentFormDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSaved?: (enrollmentId: string) => void;
  open: boolean;
  /** Pre-selected and locked when opened from a trainee's own page. */
  traineeId?: string;
};

const DUPLICATE_LOOKUP_DEBOUNCE_MS = 400;
// Shorter than this and a "contains" search returns half the roster.
const MIN_DUPLICATE_TERM_LENGTH = 5;

function isTraineeMode(value: string): value is EnrollmentTraineeMode {
  return (enrollmentTraineeModeValues as readonly string[]).includes(value);
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

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
      traineeMode: "existing",
      traineeId: traineeId ?? "",
      newTrainee: { name: "", phone: "", email: "" },
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
        if (value.traineeMode === "new") {
          // A student was added on the way: the roster and the plan's student
          // meter are both stale now.
          await queryClient.invalidateQueries({
            queryKey: trpc.trainees.pathKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: trpc.organizations.usage.queryKey(),
          });
        }
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

  const traineeMode = useStore(form.store, (state) => state.values.traineeMode);
  const newEmail = useStore(
    form.store,
    (state) => state.values.newTrainee.email,
  );
  const newPhone = useStore(
    form.store,
    (state) => state.values.newTrainee.phone,
  );

  // Soft duplicate check while typing a new student: the roster has no unique
  // constraint on email or phone, so this is the only thing standing between
  // a hurried "New student" and a second "Ahmed Mohamed". A hint rather than a
  // block — two siblings really can share a parent's phone number.
  const duplicateTerm = useDebouncedValue(
    traineeMode === "new"
      ? ([newEmail.trim(), newPhone.trim()].find(
          (term) => term.length >= MIN_DUPLICATE_TERM_LENGTH,
        ) ?? "")
      : "",
    DUPLICATE_LOOKUP_DEBOUNCE_MS,
  );
  const { data: duplicateCandidates } = useQuery({
    ...trpc.trainees.list.queryOptions({
      page: 1,
      perPage: 5,
      sorting: [],
      globalFilter: duplicateTerm,
    }),
    enabled: open && duplicateTerm.length > 0,
  });
  const duplicate = useMemo(() => {
    if (!duplicateCandidates) return null;
    const email = newEmail.trim().toLowerCase();
    const phone = normalizePhone(newPhone);
    return (
      duplicateCandidates.rows.find(
        (row) =>
          (email.length > 0 && row.email?.toLowerCase() === email) ||
          (phone.length > 0 && normalizePhone(row.phone ?? "") === phone),
      ) ?? null
    );
  }, [duplicateCandidates, newEmail, newPhone]);

  const enrollDuplicateInstead = useCallback(() => {
    if (!duplicate) return;
    form.setFieldValue("traineeId", duplicate.id);
    form.setFieldValue("traineeMode", "existing");
  }, [duplicate, form]);

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

  const traineeOptions = useMemo(() => {
    const rows = trainees?.rows ?? [];
    // The duplicate the user just accepted may sit past the first page of the
    // roster; without it in the options the combobox would show it as blank.
    const withDuplicate =
      duplicate && !rows.some((row) => row.id === duplicate.id)
        ? [...rows, duplicate]
        : rows;
    return withDuplicate.map((trainee) => ({
      value: trainee.id,
      label: trainee.name,
    }));
  }, [trainees, duplicate]);

  const courseOptions = useMemo(
    () =>
      (courses?.rows ?? []).map((course) => ({
        value: course.id,
        label: course.name,
      })),
    [courses],
  );

  const traineeModeOptions = useMemo(
    () => [
      { value: "existing", label: t("enrollments.traineeModeExisting") },
      { value: "new", label: t("enrollments.traineeModeNew") },
    ],
    [t],
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
                <>
                  <form.Field name="traineeMode">
                    {(field) => (
                      <SegmentedControl
                        fullWidth
                        size="sm"
                        options={traineeModeOptions}
                        value={field.state.value}
                        onValueChange={(value) => {
                          if (isTraineeMode(value)) field.handleChange(value);
                        }}
                      />
                    )}
                  </form.Field>

                  {traineeMode === "existing" ? (
                    <form.AppField name="traineeId">
                      {(field) => (
                        <field.ComboboxOneField
                          label={t("enrollments.trainee")}
                          options={traineeOptions}
                          placeholder={t(
                            "enrollments.traineeSearchPlaceholder",
                          )}
                        />
                      )}
                    </form.AppField>
                  ) : (
                    <>
                      <form.AppField name="newTrainee.name">
                        {(field) => (
                          <field.StringField
                            label={t("trainees.name")}
                            autoFocus
                          />
                        )}
                      </form.AppField>
                      <form.AppField name="newTrainee.phone">
                        {(field) => (
                          <field.StringField label={t("trainees.phone")} />
                        )}
                      </form.AppField>
                      <form.AppField name="newTrainee.email">
                        {(field) => (
                          <field.EmailField label={t("trainees.email")} />
                        )}
                      </form.AppField>
                      {duplicate ? (
                        <Alert variant="warning">
                          <UserRoundSearchIcon />
                          <AlertDescription>
                            {t("enrollments.possibleDuplicate", {
                              name: duplicate.name,
                            })}
                          </AlertDescription>
                          <AlertAction>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={enrollDuplicateInstead}
                            >
                              {t("enrollments.useExistingTrainee")}
                            </Button>
                          </AlertAction>
                        </Alert>
                      ) : (
                        <FieldDescription>
                          {t("enrollments.newTraineeHint")}
                        </FieldDescription>
                      )}
                    </>
                  )}
                </>
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
