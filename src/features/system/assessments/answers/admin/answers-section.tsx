"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ListChecksIcon,
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
import type { Answer } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { AnswerDeleteDialog, AnswerFormDialog } from "./components";

type RowAction = { answer: Answer; variant: "edit" | "delete" } | null;

export function AnswersSection({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: answers, isFetching } = useQuery(
    trpc.answers.list.queryOptions({ questionId }),
  );
  const moveMut = useMutation(trpc.answers.move.mutationOptions());

  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);

  async function handleMove(answer: Answer, direction: "up" | "down") {
    try {
      await moveMut.mutateAsync({ id: answer.id, direction });
      await queryClient.invalidateQueries({ queryKey: trpc.answers.pathKey() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("answers.saveFailed"));
    }
  }

  return (
    <div className="space-y-2 border-border border-s-2 ps-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {t("answers.title")}
        </h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-3.5" />
          {t("answers.add")}
        </Button>
      </div>

      {answers && answers.length === 0 ? (
        <EmptyState
          compact
          icon={<ListChecksIcon />}
          title={t("answers.emptyTitle")}
          description={t("answers.emptyDescription")}
        />
      ) : (
        <div
          className={
            isFetching
              ? "space-y-1.5 opacity-80 transition-opacity"
              : "space-y-1.5"
          }
        >
          {answers?.map((answer, index) => (
            <div
              key={answer.id}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5"
            >
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || moveMut.isPending}
                  aria-label={t("answers.moveUp")}
                  onClick={() => handleMove(answer, "up")}
                >
                  <ChevronUpIcon className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === answers.length - 1 || moveMut.isPending}
                  aria-label={t("answers.moveDown")}
                  onClick={() => handleMove(answer, "down")}
                >
                  <ChevronDownIcon className="size-3" />
                </Button>
              </div>

              {answer.isCorrect ? (
                <CheckIcon className="size-3.5 shrink-0 text-emerald-600" />
              ) : (
                <span className="size-3.5 shrink-0" />
              )}

              <span className="flex-1 text-foreground text-sm">
                {answer.text}
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
                    onClick={() => setRowAction({ answer, variant: "edit" })}
                  >
                    <PencilIcon className="size-3.5" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setRowAction({ answer, variant: "delete" })}
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

      <AnswerFormDialog
        questionId={questionId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <AnswerFormDialog
        questionId={questionId}
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        answer={rowAction?.variant === "edit" ? rowAction.answer : null}
      />
      <AnswerDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        answer={rowAction?.variant === "delete" ? rowAction.answer : null}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
