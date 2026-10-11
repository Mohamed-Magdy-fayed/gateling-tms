"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { BranchRow } from "@/features/core/organizations/server/branches";
import { useTRPC } from "@/integrations/trpc/client";
import { BranchFormDialog } from "./branch-form-dialog";

const SKELETON_ROWS = 2;

/**
 * Settings → Branches (admins). Add, rename and deactivate branches; there is
 * no delete, since every student, group and class points at one.
 */
export function BranchesSection() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const {
    data: branches,
    isPending,
    isError,
  } = useQuery(trpc.organizations.branches.list.queryOptions());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BranchRow | null>(null);

  function openAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(branch: BranchRow) {
    setEditTarget(branch);
    setDialogOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t("organizations.branches.title")}
        </CardTitle>
        <CardDescription>{t("organizations.branches.lead")}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={openAdd}>
            <PlusIcon className="size-3.5" aria-hidden />
            {t("organizations.branches.add")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("organizations.branches.columnName")}</TableHead>
                <TableHead>
                  {t("organizations.branches.columnAddress")}
                </TableHead>
                <TableHead>{t("organizations.branches.columnPhone")}</TableHead>
                <TableHead>
                  {t("organizations.branches.columnStatus")}
                </TableHead>
                <TableHead>
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-destructive">
                    {t("organizations.branches.loadFailed")}
                  </TableCell>
                </TableRow>
              ) : null}
              {isPending
                ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : (branches ?? []).map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        {branch.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.address ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {branch.phone ? (
                          <span dir="ltr">{branch.phone}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {branch.isActive ? null : (
                          <Tag>{t("organizations.branches.inactive")}</Tag>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-8"
                          onClick={() => openEdit(branch)}
                          aria-label={t("organizations.branches.edit", {
                            name: branch.name,
                          })}
                        >
                          <PencilIcon className="size-3.5" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <BranchFormDialog
        branch={editTarget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
