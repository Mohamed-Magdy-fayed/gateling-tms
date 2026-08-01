"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  HelpCircleIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TextIcon,
  Trash2Icon,
  VideoIcon,
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
import type { FormBlock, Question } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { AnswersSection } from "@/features/system/assessments/answers/admin";
import {
  BlockDeleteDialog,
  BlockFormDialog,
} from "@/features/system/assessments/blocks/admin";
import {
  QuestionDeleteDialog,
  QuestionFormDialog,
} from "@/features/system/assessments/questions/admin";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * A section's questions and content blocks, in one list.
 *
 * They share one `order` sequence on the server (`sections/server/reorder.ts`)
 * precisely so they can be interleaved — "passage, question, question,
 * diagram, question" is the shape a reading exercise actually has. Rendering
 * them as two lists would make that sequence unreachable, and would make
 * "move up" mean different things depending on which list you were in.
 */
type SectionItem =
  | { kind: "question"; order: number; question: Question }
  | { kind: "block"; order: number; block: FormBlock };

type RowAction =
  | { variant: "edit" | "delete"; item: SectionItem }
  | { variant: "createBlock" }
  | { variant: "createQuestion" }
  | null;

const BLOCK_ICON = {
  text: TextIcon,
  image: ImageIcon,
  video: VideoIcon,
} as const;

function blockLabel(block: FormBlock): string {
  return block.title || block.body || block.mediaUrl || "";
}

export function SectionItems({ sectionId }: { sectionId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: questions, isFetching: isFetchingQuestions } = useQuery(
    trpc.questions.list.queryOptions({ sectionId }),
  );
  const { data: blocks, isFetching: isFetchingBlocks } = useQuery(
    trpc.blocks.list.queryOptions({ sectionId }),
  );

  const moveQuestionMut = useMutation(trpc.questions.move.mutationOptions());
  const moveBlockMut = useMutation(trpc.blocks.move.mutationOptions());

  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null,
  );

  const items: SectionItem[] = [
    ...(questions ?? []).map(
      (question): SectionItem => ({
        kind: "question",
        order: question.order,
        question,
      }),
    ),
    ...(blocks ?? []).map(
      (block): SectionItem => ({ kind: "block", order: block.order, block }),
    ),
  ].sort((a, b) => a.order - b.order);

  const isLoaded = questions != null && blocks != null;
  const isFetching = isFetchingQuestions || isFetchingBlocks;
  const isMoving = moveQuestionMut.isPending || moveBlockMut.isPending;

  async function handleMove(item: SectionItem, direction: "up" | "down") {
    try {
      // Both mutations move within the same shared sequence, so a question can
      // swap places with a block and vice versa.
      if (item.kind === "question") {
        await moveQuestionMut.mutateAsync({ id: item.question.id, direction });
      } else {
        await moveBlockMut.mutateAsync({ id: item.block.id, direction });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.questions.pathKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.blocks.pathKey() }),
      ]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("questions.saveFailed"),
      );
    }
  }

  const editingQuestion =
    rowAction?.variant === "edit" && rowAction.item.kind === "question"
      ? rowAction.item.question
      : null;
  const deletingQuestion =
    rowAction?.variant === "delete" && rowAction.item.kind === "question"
      ? rowAction.item.question
      : null;
  const editingBlock =
    rowAction?.variant === "edit" && rowAction.item.kind === "block"
      ? rowAction.item.block
      : null;
  const deletingBlock =
    rowAction?.variant === "delete" && rowAction.item.kind === "block"
      ? rowAction.item.block
      : null;

  return (
    <div className="space-y-3 border-border border-s-2 ps-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground text-sm">
          {t("questions.title")}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setRowAction({ variant: "createBlock" })}
          >
            <PlusIcon className="size-3.5" />
            {t("blocks.add")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRowAction({ variant: "createQuestion" })}
          >
            <PlusIcon className="size-3.5" />
            {t("questions.add")}
          </Button>
        </div>
      </div>

      {isLoaded && items.length === 0 ? (
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
          {items.map((item, index) => {
            const key =
              item.kind === "question" ? item.question.id : item.block.id;
            // Short-answer questions expand too: their answer rows are the
            // wordings the grader accepts, not choices offered to the student.
            const isExpanded =
              item.kind === "question" && expandedQuestionId === item.question.id;
            const BlockIcon =
              item.kind === "block" ? BLOCK_ICON[item.block.kind] : null;

            return (
              <div
                key={key}
                className="rounded-md border border-border bg-card"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0 || isMoving}
                      aria-label={t("questions.moveUp")}
                      onClick={() => handleMove(item, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === items.length - 1 || isMoving}
                      aria-label={t("questions.moveDown")}
                      onClick={() => handleMove(item, "down")}
                    >
                      <ChevronDownIcon className="size-3" />
                    </Button>
                  </div>

                  {item.kind === "question" ? (
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-start"
                      onClick={() =>
                        setExpandedQuestionId(
                          isExpanded ? null : item.question.id,
                        )
                      }
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground text-sm">
                        {item.question.text}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-1 items-center gap-2">
                      {BlockIcon ? (
                        <BlockIcon className="size-3.5 text-muted-foreground" />
                      ) : null}
                      <span className="line-clamp-1 text-foreground text-sm">
                        {blockLabel(item.block)}
                      </span>
                    </div>
                  )}

                  {item.kind === "question" ? (
                    <>
                      <Tag color="blue">
                        {t(`questions.typeOptions.${item.question.type}`)}
                      </Tag>
                      <Tag color="neutral">
                        {item.question.points} {t("questions.points")}
                      </Tag>
                    </>
                  ) : (
                    <Tag color="violet">
                      {t(`blocks.kindOptions.${item.block.kind}`)}
                    </Tag>
                  )}

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
                        onClick={() => setRowAction({ variant: "edit", item })}
                      >
                        <PencilIcon className="size-3.5" />
                        {t("actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setRowAction({ variant: "delete", item })}
                      >
                        <Trash2Icon className="size-3.5 text-destructive" />
                        <span className="text-destructive">
                          {t("actions.delete")}
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isExpanded && item.kind === "question" ? (
                  <div className="px-3 pb-3">
                    <AnswersSection
                      questionId={item.question.id}
                      questionType={item.question.type}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <QuestionFormDialog
        sectionId={sectionId}
        open={rowAction?.variant === "createQuestion"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
      />
      <QuestionFormDialog
        sectionId={sectionId}
        open={editingQuestion != null}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        question={editingQuestion}
      />
      <QuestionDeleteDialog
        open={deletingQuestion != null}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        question={deletingQuestion}
        onDeleted={() => setRowAction(null)}
      />

      <BlockFormDialog
        sectionId={sectionId}
        open={rowAction?.variant === "createBlock"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
      />
      <BlockFormDialog
        sectionId={sectionId}
        open={editingBlock != null}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        block={editingBlock}
      />
      <BlockDeleteDialog
        open={deletingBlock != null}
        onOpenChange={(open) => {
          if (!open) setRowAction(null);
        }}
        block={deletingBlock}
        onDeleted={() => setRowAction(null)}
      />
    </div>
  );
}
