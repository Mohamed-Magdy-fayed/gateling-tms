"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BanknoteIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { formatMoney } from "./format-money";
import { PaymentDeleteDialog } from "./payment-delete-dialog";
import { type EditablePayment, PaymentFormDialog } from "./payment-form-dialog";

type PaymentDialog =
  | { kind: "create" }
  | { kind: "edit"; payment: EditablePayment }
  | { kind: "delete"; payment: { id: string; amountLabel: string } }
  | null;

/**
 * What the student has paid, and the total across it. The academy's currency
 * comes from the organization (organizations.currency) — every row is in it,
 * so the total is a plain sum.
 *
 * Delete is shown to admins only, matching `payments.delete` on the server;
 * the button is hidden rather than disabled because a teacher has nothing to
 * gain from learning the action exists.
 */
export function TraineePaymentsSection({ traineeId }: { traineeId: string }) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const [dialog, setDialog] = useState<PaymentDialog>(null);

  const {
    data: payments,
    isLoading,
    isError,
  } = useQuery(trpc.payments.list.queryOptions({ traineeId }));
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  const currency = organization?.currency ?? "EGP";
  const canDelete = organization?.role === "admin";

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        // `paidAt` is a calendar date with no zone; formatting it in UTC keeps
        // the day from shifting for viewers west of Greenwich.
        timeZone: "UTC",
      }),
    [locale],
  );

  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null);
  };

  const recordButton = (
    <Button
      type="button"
      size="sm"
      onClick={() => setDialog({ kind: "create" })}
    >
      <PlusIcon className="size-3.5" />
      {t("payments.record")}
    </Button>
  );

  const rows = payments?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("payments.title")}</CardTitle>
        <CardDescription>{t("payments.lead")}</CardDescription>
        <CardAction>{recordButton}</CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {payments && rows.length > 0 ? (
          <div className="flex items-baseline justify-between gap-3 rounded-lg bg-muted px-4 py-3">
            <span className="text-muted-foreground text-sm">
              {t("payments.totalPaid")}
            </span>
            <span className="font-display font-semibold text-xl tabular-nums">
              {formatMoney(payments.total, currency, locale)}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <EmptyState
            icon={<TriangleAlertIcon />}
            title={t("payments.loadFailedTitle")}
            description={t("errors.generic")}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BanknoteIcon />}
            title={t("payments.emptyTitle")}
            description={t("payments.emptyDescription")}
            action={recordButton}
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((payment) => {
              const amountLabel = formatMoney(payment.amount, currency, locale);
              const detail = [
                dateFmt.format(new Date(`${payment.paidAt}T00:00:00Z`)),
                t(`payments.methods.${payment.method}`),
                payment.courseName,
                payment.reference,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={payment.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm tabular-nums">
                      {amountLabel}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {detail}
                    </p>
                    {payment.note ? (
                      <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground text-xs">
                        {payment.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t("actions.edit")}
                      onClick={() =>
                        setDialog({
                          kind: "edit",
                          payment: {
                            id: payment.id,
                            amount: payment.amount,
                            paidAt: payment.paidAt,
                            method: payment.method,
                            enrollmentId: payment.enrollmentId,
                            reference: payment.reference,
                            note: payment.note,
                          },
                        })
                      }
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={t("actions.delete")}
                        onClick={() =>
                          setDialog({
                            kind: "delete",
                            payment: { id: payment.id, amountLabel },
                          })
                        }
                      >
                        <Trash2Icon className="size-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <PaymentFormDialog
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        onOpenChange={closeDialog}
        traineeId={traineeId}
        currency={currency}
        payment={dialog?.kind === "edit" ? dialog.payment : null}
      />
      <PaymentDeleteDialog
        open={dialog?.kind === "delete"}
        onOpenChange={closeDialog}
        payment={dialog?.kind === "delete" ? dialog.payment : null}
      />
    </Card>
  );
}
