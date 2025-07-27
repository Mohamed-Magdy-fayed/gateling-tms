"use client";

import type { File } from "@/server/db/schema";
import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/useTranslation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

interface DeleteFilesDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  files: Row<File>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteFilesDialog({
  files,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteFilesDialogProps) {
  const { t, isRtl } = useTranslation();
  const router = useRouter();

  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isMobile = useIsMobile();

  const deleteFiles = api.filesRouter.deleteFiles.useMutation();

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteFiles.mutateAsync({
        ids: files.map((file) => file.id),
      });

      if (error) {
        toast.error(t("content.deleteFilesDialog.deleteError"));
        return;
      }

      props.onOpenChange?.(false);
      toast.success(t("content.deleteFilesDialog.deleteSuccess", { count: files.length }));
      onSuccess?.();
      router.refresh();
    });
  }

  if (!isMobile) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              {t("content.deleteFilesDialog.triggerButton", { count: files.length.toString() })}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("content.deleteFilesDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("content.deleteFilesDialog.description", { count: files.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{t("content.deleteFilesDialog.cancel")}</Button>
            </DialogClose>
            <Button
              aria-label={t("content.deleteFilesDialog.ariaLabel")}
              variant="destructive"
              onClick={onDelete}
              disabled={isDeletePending}
            >
              {isDeletePending && (
                <Loader
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("content.deleteFilesDialog.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash className="mr-2 size-4" aria-hidden="true" />
            {t("content.deleteFilesDialog.triggerButton", { count: files.length.toString() })}
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent dir="rtl">
        <DrawerHeader>
          <DrawerTitle>{t("content.deleteFilesDialog.title")}</DrawerTitle>
          <DrawerDescription>
            {t("content.deleteFilesDialog.description", { count: files.length })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">{t("content.deleteFilesDialog.cancel")}</Button>
          </DrawerClose>
          <Button
            aria-label={t("content.deleteFilesDialog.ariaLabel")}
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {t("content.deleteFilesDialog.delete")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
