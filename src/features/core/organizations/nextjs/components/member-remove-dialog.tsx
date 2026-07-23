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
import type { OrganizationMemberRow } from "@/features/core/organizations/server/queries";
import { useTRPC } from "@/integrations/trpc/client";

type MemberRemoveDialogProps = {
  member: OrganizationMemberRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MemberRemoveDialog({
  member,
  onOpenChange,
  open,
}: MemberRemoveDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const removeMut = useMutation(
    trpc.organizations.members.remove.mutationOptions(),
  );
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!member) return;

    setPending(true);
    try {
      await toast
        .promise(removeMut.mutateAsync({ userId: member.userId }), {
          loading: t("common.loading"),
          success: t("organizations.members.removed"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("organizations.members.removeFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.organizations.members.pathKey(),
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
            {t("organizations.members.removeConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {member
              ? t("organizations.members.removeConfirmDescription", {
                  name: member.name ?? member.email ?? member.userId,
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
              <Trash2Icon className="size-3.5" />
            )}
            {t("actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
