"use client";

import type { Material } from "@/server/db/schema";
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

interface DeleteMaterialsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  materials: Row<Material>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteMaterialsDialog({
  materials,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteMaterialsDialogProps) {
  const { t } = useTranslation();

  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isMobile = useIsMobile();

  const trpcUtils = api.useUtils();
  const deleteMaterials = api.materialsRouter.deleteMaterials.useMutation();

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteMaterials.mutateAsync({
        ids: materials.map((material) => material.id),
      });

      if (error) {
        toast.error(t("content.deleteMaterialsDialog.deleteError"));
        return;
      }

      props.onOpenChange?.(false);
      toast.success(t("content.deleteMaterialsDialog.deleteSuccess", { count: materials.length }));
      onSuccess?.();
      trpcUtils.materialsRouter.invalidate();
    });
  }

  if (!isMobile) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              {t("content.deleteMaterialsDialog.triggerButton", { count: materials.length.toString() })}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("content.deleteMaterialsDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("content.deleteMaterialsDialog.description", { count: materials.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{t("content.deleteMaterialsDialog.cancel")}</Button>
            </DialogClose>
            <Button
              aria-label={t("content.deleteMaterialsDialog.ariaLabel")}
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
              {t("content.deleteMaterialsDialog.delete")}
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
            {t("content.deleteMaterialsDialog.triggerButton", { count: materials.length.toString() })}
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("content.deleteMaterialsDialog.title")}</DrawerTitle>
          <DrawerDescription>
            {t("content.deleteMaterialsDialog.description", { count: materials.length })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">{t("content.deleteMaterialsDialog.cancel")}</Button>
          </DrawerClose>
          <Button
            aria-label={t("content.deleteMaterialsDialog.ariaLabel")}
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {t("content.deleteMaterialsDialog.delete")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
