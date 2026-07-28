"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { TraineeFormDialog } from "@/features/system/learning-flow/trainees/admin";
import { useTRPC } from "@/integrations/trpc/client";

type GroupStudentAddDialogProps = {
  /** Trainee ids already on the roster — filtered out of the picker. */
  existingTraineeIds: string[];
  groupId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Picks trainees onto a group's roster, and can create a brand new trainee
 * without leaving the screen.
 *
 * That inline path is the point: phase-05.md's instant-onboarding promise is
 * "add students directly on the spot", so a teacher setting up a class must
 * never be sent to the trainees page and back. Creation goes through the
 * existing `trainees.create` mutation, so the 50-student free-plan cap
 * (assertCanAddStudent) applies here exactly as it does anywhere else.
 */
export function GroupStudentAddDialog({
  existingTraineeIds,
  groupId,
  onOpenChange,
  open,
}: GroupStudentAddDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const addMut = useMutation(trpc.groups.addStudents.mutationOptions());

  const { data: trainees, isLoading } = useQuery({
    ...trpc.trainees.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
      globalFilter: search || undefined,
    }),
    enabled: open,
  });

  // A fresh pick each time the dialog opens — carrying a stale selection over
  // would silently re-add whoever was highlighted last time.
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearch("");
    }
  }, [open]);

  const existing = useMemo(
    () => new Set(existingTraineeIds),
    [existingTraineeIds],
  );

  const available = useMemo(
    () => (trainees?.rows ?? []).filter((trainee) => !existing.has(trainee.id)),
    [trainees, existing],
  );

  const toggle = (traineeId: string) => {
    setSelectedIds((previous) =>
      previous.includes(traineeId)
        ? previous.filter((id) => id !== traineeId)
        : [...previous, traineeId],
    );
  };

  async function handleAdd() {
    if (selectedIds.length === 0) return;

    try {
      await toast
        .promise(addMut.mutateAsync({ groupId, traineeIds: selectedIds }), {
          loading: t("common.loading"),
          success: t("groups.students.added"),
          error: (err) =>
            err instanceof Error ? err.message : t("groups.students.addFailed"),
        })
        .unwrap();

      await queryClient.invalidateQueries({ queryKey: trpc.groups.pathKey() });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("groups.students.add")}</DialogTitle>
            <DialogDescription>
              {t("groups.students.addDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("groups.students.searchHint")}
                disabled={addMut.isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={addMut.isPending}
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon className="size-3.5" />
                {t("groups.students.createNew")}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : available.length === 0 ? (
              <EmptyState
                compact
                title={t("groups.students.noneAvailable")}
                description={t("groups.students.addDescription")}
              />
            ) : (
              <ScrollArea className="h-64 rounded-lg border border-border">
                <ul className="divide-y divide-border">
                  {available.map((trainee) => {
                    const isSelected = selectedIds.includes(trainee.id);
                    return (
                      <li key={trainee.id}>
                        <button
                          type="button"
                          onClick={() => toggle(trainee.id)}
                          aria-pressed={isSelected}
                          disabled={addMut.isPending}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start hover:bg-muted/60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-sm">
                              {trainee.name}
                            </span>
                            {trainee.email || trainee.phone ? (
                              <span className="block truncate text-muted-foreground text-xs">
                                {trainee.email ?? trainee.phone}
                              </span>
                            ) : null}
                          </span>
                          {isSelected ? (
                            <CheckIcon className="size-4 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMut.isPending}
            >
              <XIcon className="size-3.5" />
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleAdd()}
              disabled={selectedIds.length === 0 || addMut.isPending}
            >
              {addMut.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
              {t("groups.students.selected", { count: selectedIds.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reuses the trainees feature's own dialog rather than duplicating the
          create form — it already invalidates the trainees query on success,
          so the picker above refreshes with the new trainee in place. */}
      <TraineeFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
