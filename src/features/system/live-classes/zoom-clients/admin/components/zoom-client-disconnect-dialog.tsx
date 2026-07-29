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

type ZoomClientDisconnectDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  zoomClient: { id: string; name: string } | null;
};

export function ZoomClientDisconnectDialog({
  onOpenChange,
  open,
  zoomClient,
}: ZoomClientDisconnectDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const disconnectMut = useMutation(
    trpc.zoomClients.disconnect.mutationOptions(),
  );
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!zoomClient) return;

    setPending(true);
    try {
      await toast
        .promise(disconnectMut.mutateAsync({ id: zoomClient.id }), {
          loading: t("common.loading"),
          success: t("zoomClients.disconnected"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("zoomClients.disconnectFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.zoomClients.pathKey(),
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
            {t("zoomClients.disconnectTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {zoomClient
              ? t("zoomClients.disconnectDescription", {
                  name: zoomClient.name,
                })
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
              <PlugIcon className="size-3.5" />
            )}
            {t("zoomClients.disconnect")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
