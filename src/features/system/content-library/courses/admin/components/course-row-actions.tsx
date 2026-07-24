"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Course } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

export type CourseRowActionVariant = "edit" | "delete";

export type SetCourseRowAction = (
  next: { row: Course; variant: CourseRowActionVariant } | null,
) => void;

type CourseRowActionsProps = {
  row: Course;
  setRowAction: SetCourseRowAction;
};

export function CourseRowActions({ row, setRowAction }: CourseRowActionsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8"
            aria-label={t("common.actions")}
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => setRowAction({ row, variant: "edit" })}
        >
          <PencilIcon className="size-3.5" />
          {t("actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setRowAction({ row, variant: "delete" })}
        >
          <Trash2Icon className="size-3.5 text-destructive" />
          <span className="text-destructive">{t("actions.delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
