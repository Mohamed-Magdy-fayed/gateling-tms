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
import { type Course } from "@/server/db/schema";
import { exportToExcel } from "@/features/data-table/lib/exceljs";
import { api } from "@/trpc/react";
import { useTranslation } from "@/i18n/useTranslation";
import { useRouter } from "next/navigation";
import { DeleteCoursesDialog } from "@/features/content/components/courses-delete-dialog";

const actions = [
  "export",
  "delete",
] as const;

type Action = (typeof actions)[number];

interface CoursesActionBarProps {
  table: Table<Course>;
}

export function CoursesActionBar({ table }: CoursesActionBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onCourseExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportToExcel(table.getSelectedRowModel().rows, "Courses", "Courses");
    });
  }, [table]);

  const deleteCoureses = api.coursesRouter.deleteCourses.useMutation()
  const onCourseDelete = React.useCallback(() => {
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
      <DeleteCoursesDialog
        open={currentAction === "delete"}
        onOpenChange={() => setCurrentAction(null)}
        courses={rows.map((row) => row.original)}
        showTrigger={false}
        onSuccess={onCourseDelete}
      />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <DataTableActionBarAction
          size="icon"
          tooltip={t("content.courses.actionBar.exportTooltip")}
          isPending={getIsActionPending("export")}
          onClick={onCourseExport}
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          size="icon"
          tooltip={t("content.courses.actionBar.deleteTooltip")}
          isPending={getIsActionPending("delete")}
          onClick={() => setCurrentAction("delete")}
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
