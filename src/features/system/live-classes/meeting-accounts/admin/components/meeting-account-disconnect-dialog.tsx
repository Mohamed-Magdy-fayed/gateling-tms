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

type MeetingAccountDisconnectDialogProps = {
  meetingAccount: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MeetingAccountDisconnectDialog({
  meetingAccount,
  onOpenChange,
  open,
}: MeetingAccountDisconnectDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const disconnectMut = useMutation(
    trpc.meetingAccounts.disconnect.mutationOptions(),
  );
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!meetingAccount) return;

    setPending(true);
    try {
      await toast
        .promise(disconnectMut.mutateAsync({ id: meetingAccount.id }), {
          loading: t("common.loading"),
          success: t("meetingAccounts.disconnected"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("meetingAccounts.disconnectFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.meetingAccounts.pathKey(),
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
            {t("meetingAccounts.disconnectTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {meetingAccount
              ? t("meetingAccounts.disconnectDescription", {
                  name: meetingAccount.name,
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
            {t("meetingAccounts.disconnect")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
