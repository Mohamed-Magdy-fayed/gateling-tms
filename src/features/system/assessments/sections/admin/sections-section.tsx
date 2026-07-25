"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ListTreeIcon,
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
import type { FormSection } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { QuestionsSection } from "@/features/system/assessments/questions/admin";
import { useTRPC } from "@/integrations/trpc/client";

import { SectionDeleteDialog, SectionFormDialog } from "./components";

type RowAction = { section: FormSection; variant: "edit" | "delete" } | null;

export function SectionsSection({ formId }: { formId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: sections, isFetching } = useQuery(
    trpc.sections.list.queryOptions({ formId }),
  );
  const moveMut = useMutation(trpc.sections.move.mutationOptions());

  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    null,
  );

  async function handleMove(section: FormSection, direction: "up" | "down") {
    try {
      await moveMut.mutateAsync({ id: section.id, direction });
      await queryClient.invalidateQueries({
        queryKey: trpc.sections.pathKey(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sections.saveFailed"),
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-foreground text-lg">
          {t("sections.title")}
        </h2>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-3.5" />
          {t("sections.add")}
        </Button>
      </div>

      {sections && sections.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<ListTreeIcon />}
              title={t("sections.emptyTitle")}
              description={t("sections.emptyDescription")}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            isFetching ? "space-y-2 opacity-80 transition-opacity" : "space-y-2"
          }
        >
          {sections?.map((section, index) => {
            const isExpanded = expandedSectionId === section.id;

            return (
              <Card key={section.id} className="gap-0 py-3">
                <CardContent className="flex items-center gap-3 px-4">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0 || moveMut.isPending}
                      aria-label={t("sections.moveUp")}
                      onClick={() => handleMove(section, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={
                        index === sections.length - 1 || moveMut.isPending
                      }
                      aria-label={t("sections.moveDown")}
                      onClick={() => handleMove(section, "down")}
                    >
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  </div>

                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 text-start"
                    onClick={() =>
                      setExpandedSectionId(isExpanded ? null : section.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground text-sm">
                      {section.title}
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
                        onClick={() =>
                          setRowAction({ section, variant: "edit" })
                        }
                      >
                        <PencilIcon className="size-3.5" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setRowAction({ section, variant: "delete" })
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
                    <QuestionsSection sectionId={section.id} />
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <SectionFormDialog
        formId={formId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <SectionFormDialog
        formId={formId}
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        section={rowAction?.variant === "edit" ? rowAction.section : null}
      />
      <SectionDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        section={rowAction?.variant === "delete" ? rowAction.section : null}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
