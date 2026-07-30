"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SendIcon, XIcon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import {
  FormAnswerSheet,
  useAnswerDrafts,
} from "@/features/system/assessments/responses/admin";
import { useTRPC } from "@/integrations/trpc/client";

type PlacementTestRunnerDialogProps = {
  formId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  placementTestId: string;
  traineeName: string;
};

/**
 * A staff member transcribing the trainee's answers.
 *
 * Trainees have no accounts (STATE.md D77), so there is no self-service
 * surface to send them to in v1 — the same form the assessments Preview tab
 * renders is filled in here on their behalf, and scored by the same scorer.
 */
export function PlacementTestRunnerDialog({
  formId,
  onOpenChange,
  open,
  placementTestId,
  traineeName,
}: PlacementTestRunnerDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    ...trpc.forms.getTree.queryOptions({ id: formId }),
    enabled: open,
  });
  const recordMut = useMutation(
    trpc.placementTests.recordAttempt.mutationOptions(),
  );

  const {
    drafts,
    toggleChoice,
    setShortAnswerText,
    reset,
    toSubmittableAnswers,
  } = useAnswerDrafts();

  // biome-ignore lint/correctness/useExhaustiveDependencies: clears the sheet when the dialog opens for a (possibly different) test, not on every render
  useEffect(() => {
    if (open) reset();
  }, [open, placementTestId]);

  const hasQuestions = (sections ?? []).some(
    (section) => section.questions.length > 0,
  );

  async function handleSubmit() {
    const answers = toSubmittableAnswers();

    if (answers.length === 0) {
      toast.error(t("placementTests.unanswered"));
      return;
    }

    try {
      await toast
        .promise(recordMut.mutateAsync({ id: placementTestId, answers }), {
          loading: t("common.loading"),
          success: t("placementTests.recorded"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("placementTests.recordFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.placementTests.pathKey(),
      });
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("placementTests.run")}</DialogTitle>
          <DialogDescription>
            {t("placementTests.runDescription", { name: traineeName })}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : hasQuestions ? (
            <FormAnswerSheet
              sections={sections ?? []}
              drafts={drafts}
              idPrefix={`placement-${placementTestId}`}
              onToggleChoice={toggleChoice}
              onSetShortAnswerText={setShortAnswerText}
            />
          ) : (
            <EmptyState
              title={t("responses.previewEmptyTitle")}
              description={t("responses.previewEmptyDescription")}
            />
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={recordMut.isPending}
          >
            <XIcon className="size-3.5" />
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={recordMut.isPending || !hasQuestions}
          >
            {recordMut.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SendIcon className="size-3.5" />
            )}
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
