"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { type PaymentMethod, paymentMethodValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type PaymentMutationInput,
  paymentMutationSchema,
} from "@/features/system/students/payments/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";
import { todayIsoDate } from "@/lib/today-iso-date";

export type EditablePayment = {
  id: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  enrollmentId: string | null;
  reference: string | null;
  note: string | null;
};

// What the form holds, as opposed to what the server accepts: a cleared
// number input reads back as null, so `amount` starts out that way rather
// than as a 0 the user has to delete first. The schema's `z.number()` turns
// a still-empty field into the "enter an amount" message on submit, so a
// value that reaches onSubmit always has a number in it.
type PaymentFormValues = Omit<PaymentMutationInput, "amount"> & {
  amount: number | null;
};

type PaymentFormDialogProps = {
  currency: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  payment?: EditablePayment | null;
  traineeId: string;
};

export function PaymentFormDialog({
  currency,
  onOpenChange,
  open,
  payment,
  traineeId,
}: PaymentFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = payment != null;

  const createMut = useMutation(trpc.payments.create.mutationOptions());
  const updateMut = useMutation(trpc.payments.update.mutationOptions());

  // Only this student's enrollments are offered — the server refuses any
  // other (payments/server/mutations.ts) — and only while the dialog is
  // open, so it is never on the critical path of the profile itself.
  const { data: enrollments } = useQuery({
    ...trpc.enrollments.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
      traineeId,
    }),
    enabled: open,
  });

  const defaultValues = useMemo<PaymentFormValues>(
    () => ({
      traineeId,
      amount: payment?.amount ?? null,
      paidAt: payment?.paidAt ?? todayIsoDate(),
      method: payment?.method ?? "cash",
      enrollmentId: payment?.enrollmentId ?? "",
      reference: payment?.reference ?? "",
      note: payment?.note ?? "",
    }),
    [traineeId, payment],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: paymentMutationSchema },
    onSubmit: async ({ value }) => {
      // Validated by paymentMutationSchema just before this runs, so the
      // nullable form shape has already been narrowed (see PaymentFormValues).
      const input = value as PaymentMutationInput;
      // Widened: create and update resolve to different shapes, and only
      // the settling matters here.
      const action: Promise<unknown> =
        isEdit && payment
          ? updateMut.mutateAsync({ id: payment.id, ...input })
          : createMut.mutateAsync(input);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: isEdit ? t("payments.updated") : t("payments.recorded"),
            error: (err) =>
              err instanceof Error ? err.message : t("payments.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.payments.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens or switches payment, not on every identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, payment?.id]);

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

  const enrollmentOptions = useMemo(
    () =>
      (enrollments?.rows ?? []).map((enrollment) => ({
        value: enrollment.id,
        label: enrollment.courseName,
      })),
    [enrollments],
  );

  const methodOptions = useMemo(
    () =>
      paymentMethodValues.map((method) => ({
        value: method,
        label: t(`payments.methods.${method}`),
      })),
    [t],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("payments.edit") : t("payments.record")}
          </DialogTitle>
          <DialogDescription>
            {t("payments.formDescription", { currency })}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <form.AppField name="amount">
                  {(field) => (
                    <field.NumberField
                      label={t("payments.amount", { currency })}
                      autoFocus
                    />
                  )}
                </form.AppField>

                <form.AppField name="paidAt">
                  {(field) => (
                    <field.StringField
                      label={t("payments.paidAt")}
                      inputType="date"
                    />
                  )}
                </form.AppField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.AppField name="method">
                  {(field) => (
                    <field.SelectField
                      label={t("payments.method")}
                      options={methodOptions}
                    />
                  )}
                </form.AppField>

                <form.AppField name="enrollmentId">
                  {(field) => (
                    <field.SelectField
                      label={t("payments.course")}
                      description={t("payments.courseDescription")}
                      options={enrollmentOptions}
                      placeholder={t("payments.noCourse")}
                    />
                  )}
                </form.AppField>
              </div>

              <form.AppField name="reference">
                {(field) => (
                  <field.StringField
                    label={t("payments.reference")}
                    description={t("payments.referenceDescription")}
                  />
                )}
              </form.AppField>

              <form.AppField name="note">
                {(field) => (
                  <field.TextareaField label={t("payments.note")} rows={3} />
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
              {isEdit ? t("actions.save") : t("payments.record")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
