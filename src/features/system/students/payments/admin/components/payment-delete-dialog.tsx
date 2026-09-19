"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type PaymentDeleteDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  payment: { id: string; amountLabel: string } | null;
};

export function PaymentDeleteDialog({
  onOpenChange,
  open,
  payment,
}: PaymentDeleteDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.payments.delete.mutationOptions());
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!payment) return;

    setPending(true);
    try {
      await toast
        .promise(deleteMut.mutateAsync({ id: payment.id }), {
          loading: t("common.loading"),
          success: t("payments.deleted"),
          error: (err) =>
            err instanceof Error ? err.message : t("payments.deleteFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.payments.pathKey(),
      });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("payments.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {payment
              ? t("payments.deleteDescription", { amount: payment.amountLabel })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            <XIcon className="size-3.5" />
            {t("actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <Trash2Icon className="size-3.5" />
            )}
            {t("actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
