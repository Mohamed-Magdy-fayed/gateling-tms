"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/features/data-table/components/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { type Level } from "@/server/db/schema";
import { exportToExcel } from "@/features/data-table/lib/exceljs";
import { api } from "@/trpc/react";
import { useTranslation } from "@/i18n/useTranslation";
import { useRouter } from "next/navigation";
import { DeleteLevelsDialog } from "@/features/content/components/levels/level-delete-dialog";
import ExportForm from "@/features/data-table/components/data-table-export-form";

const actions = [
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface LevelsActionBarProps {
  table: Table<Level>;
}

export function LevelsActionBar({ table }: LevelsActionBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onLevelExport = React.useCallback(() => {
    setCurrentAction("export");
    // startTransition(() => {
    //   exportToExcel(table.getSelectedRowModel().rows.map(row => row.original), "Levels", "Levels");
    // });
  }, [table]);

  const deleteCoureses = api.levelsRouter.deleteLevels.useMutation()
  const onLevelDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteCoureses.mutateAsync({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      table.toggleAllRowsSelected(false);
      router.refresh()
    });
  }, [rows, table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <DeleteLevelsDialog
        open={currentAction === "delete"}
        onOpenChange={() => setCurrentAction(null)}
        levels={rows.map((row) => row.original)}
        showTrigger={false}
        onSuccess={onLevelDelete}
      />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        {/* <DataTableActionBarAction
          size="icon"
          tooltip={t("content.levels.actionBar.exportTooltip")}
          isPending={getIsActionPending("export")}
          onClick={onLevelExport}
        >
          <Download />
        </DataTableActionBarAction> */}
        <ExportForm
          data={table.getFilteredRowModel().rows.map(row => row.original)}
          selectedData={table.getSelectedRowModel().rows.map(row => row.original)}
          fileName={t("content.courseForm.courses")}
          sheetName={t("content.courseForm.courses")}
          isOpen={currentAction === "export"}
          setIsOpen={(val) => setCurrentAction(!!val ? "export" : null)}
          isLoading={getIsActionPending("export")}
        />
        <DataTableActionBarAction
          size="icon"
          tooltip={t("content.levels.actionBar.deleteTooltip")}
          isPending={getIsActionPending("delete")}
          onClick={() => setCurrentAction("delete")}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
