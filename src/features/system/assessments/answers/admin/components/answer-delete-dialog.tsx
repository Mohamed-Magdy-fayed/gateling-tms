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
import type { Answer } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type AnswerDeleteDialogProps = {
  answer: Answer | null;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AnswerDeleteDialog({
  answer,
  onDeleted,
  onOpenChange,
  open,
}: AnswerDeleteDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.answers.delete.mutationOptions());
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!answer) return;

    setPending(true);
    try {
      await toast
        .promise(deleteMut.mutateAsync({ id: answer.id }), {
          loading: t("common.loading"),
          success: t("answers.deleted"),
          error: (err) =>
            err instanceof Error ? err.message : t("answers.deleteFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({ queryKey: trpc.answers.pathKey() });
      onDeleted?.();
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
          <AlertDialogTitle>{t("answers.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {answer ? t("answers.deleteDescription") : ""}
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
