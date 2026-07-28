"use client";

import {
  ArrowRightLeftIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/features/core/i18n/client";
import type { EnrollmentListRow } from "./enrollments-table-columns";

// No "edit": trainee and course are the enrollment's identity, so the only
// thing that moves is its status.
export type EnrollmentRowActionVariant = "status" | "delete";

export type SetEnrollmentRowAction = (
  next: { row: EnrollmentListRow; variant: EnrollmentRowActionVariant } | null,
) => void;

type EnrollmentRowActionsProps = {
  row: EnrollmentListRow;
  setRowAction: SetEnrollmentRowAction;
};

export function EnrollmentRowActions({
  row,
  setRowAction,
}: EnrollmentRowActionsProps) {
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={<Link href={`/learning-flow/trainees/${row.traineeId}`} />}
        >
          <UserIcon className="size-3.5" />
          {t("enrollments.trainee")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setRowAction({ row, variant: "status" })}
        >
          <ArrowRightLeftIcon className="size-3.5" />
          {t("enrollments.changeStatus")}
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
