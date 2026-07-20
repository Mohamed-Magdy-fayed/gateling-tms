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
import type { DemoItem } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

type DemoItemDeleteDialogProps = {
  item: DemoItem | null;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DemoItemDeleteDialog({
  item,
  onDeleted,
  onOpenChange,
  open,
}: DemoItemDeleteDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.demo.delete.mutationOptions());
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!item) return;

    setPending(true);
    try {
      await toast
        .promise(deleteMut.mutateAsync({ id: item.id }), {
          loading: t("common.loading"),
          success: t("systemPages.demoItemDeleted"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("systemPages.demoItemDeleteFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({ queryKey: trpc.demo.pathKey() });
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
          <AlertDialogTitle>
            {t("systemPages.deleteDemoItemTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {item
              ? t("systemPages.deleteDemoItemDescription", { name: item.name })
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
