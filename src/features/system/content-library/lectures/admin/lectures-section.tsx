"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import type { Lecture } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { LectureDeleteDialog, LectureFormDialog } from "./components";

type RowAction = { lecture: Lecture; variant: "edit" | "delete" } | null;

export function LecturesSection({ levelId }: { levelId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: lectures, isFetching } = useQuery(
    trpc.lectures.list.queryOptions({ levelId }),
  );
  const moveMut = useMutation(trpc.lectures.move.mutationOptions());

  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);

  async function handleMove(lecture: Lecture, direction: "up" | "down") {
    try {
      await moveMut.mutateAsync({ id: lecture.id, direction });
      await queryClient.invalidateQueries({
        queryKey: trpc.lectures.pathKey(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("lectures.saveFailed"),
      );
    }
  }

  return (
    <div className="space-y-3 border-border border-s-2 ps-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground text-sm">
          {t("lectures.title")}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-3.5" />
          {t("lectures.add")}
        </Button>
      </div>

      {lectures && lectures.length === 0 ? (
        <EmptyState
          compact
          icon={<BookOpenIcon />}
          title={t("lectures.emptyTitle")}
          description={t("lectures.emptyDescription")}
        />
      ) : (
        <div
          className={
            isFetching ? "space-y-2 opacity-80 transition-opacity" : "space-y-2"
          }
        >
          {lectures?.map((lecture, index) => (
            <div
              key={lecture.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || moveMut.isPending}
                  aria-label={t("lectures.moveUp")}
                  onClick={() => handleMove(lecture, "up")}
                >
                  <ChevronUpIcon className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === lectures.length - 1 || moveMut.isPending}
                  aria-label={t("lectures.moveDown")}
                  onClick={() => handleMove(lecture, "down")}
                >
                  <ChevronDownIcon className="size-3" />
                </Button>
              </div>

              <span className="flex-1 font-medium text-foreground text-sm">
                {lecture.name}
              </span>

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
                    onClick={() => setRowAction({ lecture, variant: "edit" })}
                  >
                    <PencilIcon className="size-3.5" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setRowAction({ lecture, variant: "delete" })}
                  >
                    <Trash2Icon className="size-3.5 text-destructive" />
                    <span className="text-destructive">
                      {t("actions.delete")}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <LectureFormDialog
        levelId={levelId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <LectureFormDialog
        levelId={levelId}
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        lecture={rowAction?.variant === "edit" ? rowAction.lecture : null}
      />
      <LectureDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        lecture={rowAction?.variant === "delete" ? rowAction.lecture : null}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
