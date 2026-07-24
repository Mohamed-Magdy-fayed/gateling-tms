"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import type { Level } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { LecturesSection } from "@/features/system/content-library/lectures/admin";
import { useTRPC } from "@/integrations/trpc/client";

import { LevelDeleteDialog, LevelFormDialog } from "./components";

type RowAction = { level: Level; variant: "edit" | "delete" } | null;

export function LevelsSection({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: levels, isFetching } = useQuery(
    trpc.levels.list.queryOptions({ courseId }),
  );
  const moveMut = useMutation(trpc.levels.move.mutationOptions());

  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  async function handleMove(level: Level, direction: "up" | "down") {
    try {
      await moveMut.mutateAsync({ id: level.id, direction });
      await queryClient.invalidateQueries({ queryKey: trpc.levels.pathKey() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("levels.saveFailed"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-foreground text-lg">
          {t("levels.title")}
        </h2>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" />
          {t("levels.add")}
        </Button>
      </div>

      {levels && levels.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<LayersIcon />}
              title={t("levels.emptyTitle")}
              description={t("levels.emptyDescription")}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            isFetching ? "space-y-2 opacity-80 transition-opacity" : "space-y-2"
          }
        >
          {levels?.map((level, index) => {
            const isExpanded = expandedLevelId === level.id;

            return (
              <Card key={level.id} className="gap-0 py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0 || moveMut.isPending}
                      aria-label={t("levels.moveUp")}
                      onClick={() => handleMove(level, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={
                        index === levels.length - 1 || moveMut.isPending
                      }
                      aria-label={t("levels.moveDown")}
                      onClick={() => handleMove(level, "down")}
                    >
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  </div>

                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 text-start"
                    onClick={() =>
                      setExpandedLevelId(isExpanded ? null : level.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground text-sm">
                      {level.name}
                    </span>
                  </button>

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
                        onClick={() => setRowAction({ level, variant: "edit" })}
                      >
                        <PencilIcon className="size-3.5" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setRowAction({ level, variant: "delete" })
                        }
                      >
                        <Trash2Icon className="size-3.5 text-destructive" />
                        <span className="text-destructive">
                          {t("actions.delete")}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>

                {isExpanded ? (
                  <CardContent className="px-4 pt-3">
                    <LecturesSection levelId={level.id} />
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <LevelFormDialog
        courseId={courseId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <LevelFormDialog
        courseId={courseId}
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        level={rowAction?.variant === "edit" ? rowAction.level : null}
      />
      <LevelDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        level={rowAction?.variant === "delete" ? rowAction.level : null}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
