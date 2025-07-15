"use client";

import type { Course } from "@/server/db/schema";
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

interface DeleteCoursesDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  courses: Row<Course>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteCoursesDialog({
  courses,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteCoursesDialogProps) {
  const { t, isRtl } = useTranslation();
  const router = useRouter();

  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isMobile = useIsMobile();

  const deleteCourses = api.coursesRouter.deleteCourses.useMutation();

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteCourses.mutateAsync({
        ids: courses.map((course) => course.id),
      });

      if (error) {
        toast.error(t("content.deleteCoursesDialog.deleteError"));
        return;
      }

      props.onOpenChange?.(false);
      toast.success(t("content.deleteCoursesDialog.deleteSuccess", { count: courses.length }));
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
              {t("content.deleteCoursesDialog.triggerButton", { count: courses.length.toString() })}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("content.deleteCoursesDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("content.deleteCoursesDialog.description", { count: courses.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{t("content.deleteCoursesDialog.cancel")}</Button>
            </DialogClose>
            <Button
              aria-label={t("content.deleteCoursesDialog.ariaLabel")}
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
              {t("content.deleteCoursesDialog.delete")}
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
            {t("content.deleteCoursesDialog.triggerButton", { count: courses.length.toString() })}
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent dir="rtl">
        <DrawerHeader>
          <DrawerTitle>{t("content.deleteCoursesDialog.title")}</DrawerTitle>
          <DrawerDescription>
            {t("content.deleteCoursesDialog.description", { count: courses.length })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">{t("content.deleteCoursesDialog.cancel")}</Button>
          </DrawerClose>
          <Button
            aria-label={t("content.deleteCoursesDialog.ariaLabel")}
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {t("content.deleteCoursesDialog.delete")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
