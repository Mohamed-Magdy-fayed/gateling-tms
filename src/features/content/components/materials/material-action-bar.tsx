"use client";

import type { Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/features/data-table/components/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { type Material } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useTranslation } from "@/i18n/useTranslation";
import { useRouter } from "next/navigation";
import { DeleteMaterialsDialog } from "@/features/content/components/materials/materials-delete-dialog";
import ExportForm from "@/features/data-table/components/data-table-export-form";

const actions = [
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface MaterialsActionBarProps {
  table: Table<Material>;
}

export function MaterialsActionBar({ table }: MaterialsActionBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onMaterialExport = React.useCallback(() => {
    setCurrentAction("export");
  }, [table]);

  const deleteCoureses = api.materialsRouter.deleteMaterials.useMutation()
  const onMaterialDelete = React.useCallback(() => {
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
      <DeleteMaterialsDialog
        open={currentAction === "delete"}
        onOpenChange={() => setCurrentAction(null)}
        materials={rows.map((row) => row.original)}
        showTrigger={false}
        onSuccess={onMaterialDelete}
      />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <ExportForm
          data={table.getFilteredRowModel().rows.map(row => row.original)}
          selectedData={table.getSelectedRowModel().rows.map(row => row.original)}
          fileName={t("content.materialForm.materials")}
          sheetName={t("content.materialForm.materials")}
          isOpen={currentAction === "export"}
          setIsOpen={(val) => setCurrentAction(!!val ? "export" : null)}
          isLoading={getIsActionPending("export")}
        />
        <DataTableActionBarAction
          size="icon"
          tooltip={t("content.materials.actionBar.deleteTooltip")}
          isPending={getIsActionPending("delete")}
          onClick={() => setCurrentAction("delete")}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
