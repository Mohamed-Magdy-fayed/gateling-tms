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

type CertificateRevokeDialogProps = {
  certificate: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onRevoked?: () => void;
  open: boolean;
};

// "Revoke" rather than "delete" in the copy: the row is hard-deleted, but what
// the user is doing is withdrawing a certificate they issued.
export function CertificateRevokeDialog({
  certificate,
  onOpenChange,
  onRevoked,
  open,
}: CertificateRevokeDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.certificates.delete.mutationOptions());
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!certificate) return;

    setPending(true);
    try {
      await toast
        .promise(deleteMut.mutateAsync({ id: certificate.id }), {
          loading: t("common.loading"),
          success: t("certificates.revoked"),
          error: (err) =>
            err instanceof Error ? err.message : t("certificates.revokeFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.certificates.pathKey(),
      });
      onRevoked?.();
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
          <AlertDialogTitle>{t("certificates.revokeTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {certificate
              ? t("certificates.revokeDescription", { name: certificate.title })
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
            {t("certificates.revoke")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
