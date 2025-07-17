"use client";

import type { Level } from "@/server/db/schema";
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

interface DeleteLevelsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  levels: Row<Level>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteLevelsDialog({
  levels,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteLevelsDialogProps) {
  const { t } = useTranslation();

  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isMobile = useIsMobile();

  const trpcUtils = api.useUtils();
  const deleteLevels = api.levelsRouter.deleteLevels.useMutation();

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteLevels.mutateAsync({
        ids: levels.map((level) => level.id),
      });

      if (error) {
        toast.error(t("content.deleteLevelsDialog.deleteError"));
        return;
      }

      props.onOpenChange?.(false);
      toast.success(t("content.deleteLevelsDialog.deleteSuccess", { count: levels.length }));
      onSuccess?.();
      trpcUtils.levelsRouter.invalidate();
    });
  }

  if (!isMobile) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              {t("content.deleteLevelsDialog.triggerButton", { count: levels.length.toString() })}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("content.deleteLevelsDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("content.deleteLevelsDialog.description", { count: levels.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{t("content.deleteLevelsDialog.cancel")}</Button>
            </DialogClose>
            <Button
              aria-label={t("content.deleteLevelsDialog.ariaLabel")}
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
              {t("content.deleteLevelsDialog.delete")}
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
            {t("content.deleteLevelsDialog.triggerButton", { count: levels.length.toString() })}
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent dir="rtl">
        <DrawerHeader>
          <DrawerTitle>{t("content.deleteLevelsDialog.title")}</DrawerTitle>
          <DrawerDescription>
            {t("content.deleteLevelsDialog.description", { count: levels.length })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">{t("content.deleteLevelsDialog.cancel")}</Button>
          </DrawerClose>
          <Button
            aria-label={t("content.deleteLevelsDialog.ariaLabel")}
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {t("content.deleteLevelsDialog.delete")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
