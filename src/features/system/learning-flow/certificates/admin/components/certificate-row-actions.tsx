"use client";

import {
  ExternalLinkIcon,
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
import type { CertificateListRow } from "./certificates-table-columns";

// No "edit": a certificate records something that already happened, so the
// only corrective action is to revoke it and issue a new one.
export type CertificateRowActionVariant = "revoke";

export type SetCertificateRowAction = (
  next: {
    row: CertificateListRow;
    variant: CertificateRowActionVariant;
  } | null,
) => void;

type CertificateRowActionsProps = {
  row: CertificateListRow;
  setRowAction: SetCertificateRowAction;
};

export function CertificateRowActions({
  row,
  setRowAction,
}: CertificateRowActionsProps) {
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
        <DropdownMenuItem render={<Link href={`/certificates/${row.id}`} />}>
          <ExternalLinkIcon className="size-3.5" />
          {t("certificates.view")}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={`/learning-flow/trainees/${row.traineeId}`} />}
        >
          <UserIcon className="size-3.5" />
          {t("enrollments.trainee")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setRowAction({ row, variant: "revoke" })}
        >
          <Trash2Icon className="size-3.5 text-destructive" />
          <span className="text-destructive">{t("certificates.revoke")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
