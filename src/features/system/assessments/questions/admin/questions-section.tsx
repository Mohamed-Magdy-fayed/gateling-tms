"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  HelpCircleIcon,
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
import { Tag } from "@/components/ui/tag";
import type { Question } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { AnswersSection } from "@/features/system/assessments/answers/admin";
import { useTRPC } from "@/integrations/trpc/client";

import { QuestionDeleteDialog, QuestionFormDialog } from "./components";

type RowAction = { question: Question; variant: "edit" | "delete" } | null;

export function QuestionsSection({ sectionId }: { sectionId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: questions, isFetching } = useQuery(
    trpc.questions.list.queryOptions({ sectionId }),
  );
  const moveMut = useMutation(trpc.questions.move.mutationOptions());

  const [createOpen, setCreateOpen] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null,
  );

  async function handleMove(question: Question, direction: "up" | "down") {
    try {
      await moveMut.mutateAsync({ id: question.id, direction });
      await queryClient.invalidateQueries({
        queryKey: trpc.questions.pathKey(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("questions.saveFailed"),
      );
    }
  }

  return (
    <div className="space-y-3 border-border border-s-2 ps-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground text-sm">
          {t("questions.title")}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-3.5" />
          {t("questions.add")}
        </Button>
      </div>

      {questions && questions.length === 0 ? (
        <EmptyState
          compact
          icon={<HelpCircleIcon />}
          title={t("questions.emptyTitle")}
          description={t("questions.emptyDescription")}
        />
      ) : (
        <div
          className={
            isFetching ? "space-y-2 opacity-80 transition-opacity" : "space-y-2"
          }
        >
          {questions?.map((question, index) => {
            const isChoice = question.type !== "short_answer";
            const isExpanded = isChoice && expandedQuestionId === question.id;

            return (
              <div
                key={question.id}
                className="rounded-md border border-border bg-card"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0 || moveMut.isPending}
                      aria-label={t("questions.moveUp")}
                      onClick={() => handleMove(question, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={
                        index === questions.length - 1 || moveMut.isPending
                      }
                      aria-label={t("questions.moveDown")}
                      onClick={() => handleMove(question, "down")}
                    >
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  </div>

                  {isChoice ? (
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-start"
                      onClick={() =>
                        setExpandedQuestionId(isExpanded ? null : question.id)
                      }
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground text-sm">
                        {question.text}
                      </span>
                    </button>
                  ) : (
                    <span className="flex-1 font-medium text-foreground text-sm">
                      {question.text}
                    </span>
                  )}

                  <Tag color="blue">
                    {t(`questions.typeOptions.${question.type}`)}
                  </Tag>
                  <Tag color="neutral">
                    {question.points} {t("questions.points")}
                  </Tag>

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
                          setRowAction({ question, variant: "edit" })
                        }
                      >
                        <PencilIcon className="size-3.5" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setRowAction({ question, variant: "delete" })
                        }
                      >
                        <Trash2Icon className="size-3.5 text-destructive" />
                        <span className="text-destructive">
                          {t("actions.delete")}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isExpanded ? (
                  <div className="px-3 pb-3">
                    <AnswersSection questionId={question.id} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <QuestionFormDialog
        sectionId={sectionId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <QuestionFormDialog
        sectionId={sectionId}
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        question={rowAction?.variant === "edit" ? rowAction.question : null}
      />
      <QuestionDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        question={rowAction?.variant === "delete" ? rowAction.question : null}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
