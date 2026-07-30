"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlugIcon, XIcon } from "lucide-react";
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

type GoogleDisconnectDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function GoogleDisconnectDialog({
  onOpenChange,
  open,
}: GoogleDisconnectDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const disconnectMut = useMutation(
    trpc.googleImport.disconnect.mutationOptions(),
  );
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await toast
        .promise(disconnectMut.mutateAsync(), {
          loading: t("common.loading"),
          success: t("googleImport.disconnected"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("googleImport.disconnectFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.googleImport.pathKey(),
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
          <AlertDialogTitle>
            {t("googleImport.disconnectTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("googleImport.disconnectDescription")}
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
              <PlugIcon className="size-3.5" />
            )}
            {t("googleImport.disconnect")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
