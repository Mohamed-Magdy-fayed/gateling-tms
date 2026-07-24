"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  SquarePenIcon,
  Trash2Icon,
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
import type { Form } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";

export type FormRowActionVariant = "edit" | "delete";

export type SetFormRowAction = (
  next: { row: Form; variant: FormRowActionVariant } | null,
) => void;

type FormRowActionsProps = {
  row: Form;
  setRowAction: SetFormRowAction;
};

export function FormRowActions({ row, setRowAction }: FormRowActionsProps) {
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
        <DropdownMenuItem render={<Link href={`/assessments/${row.id}`} />}>
          <SquarePenIcon className="size-3.5" />
          {t("assessments.tabs.builder")}
        </DropdownMenuItem>
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
