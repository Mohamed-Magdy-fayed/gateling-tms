"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { EnrollmentStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  allowedTransitions,
  ENROLLMENT_TRANSITIONS,
} from "@/features/system/learning-flow/status-transitions";
import { useTRPC } from "@/integrations/trpc/client";
import { EnrollmentStatusTag } from "./enrollment-status-tag";

type EnrollmentStatusDialogProps = {
  enrollment: {
    id: string;
    traineeName: string;
    status: EnrollmentStatus;
  } | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  open: boolean;
};

/**
 * Offers only the moves the server would accept, read from the same transition
 * graph the mutation validates against — so the dialog can't present an option
 * that is rejected on submit.
 */
export function EnrollmentStatusDialog({
  enrollment,
  onOpenChange,
  onUpdated,
  open,
}: EnrollmentStatusDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const updateMut = useMutation(
    trpc.enrollments.updateStatus.mutationOptions(),
  );
  const [selected, setSelected] = useState<EnrollmentStatus | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: resets the choice when the dialog opens for a (possibly different) enrollment, not on every render
  useEffect(() => {
    if (open) setSelected(null);
  }, [open, enrollment?.id]);

  const options = enrollment
    ? allowedTransitions(ENROLLMENT_TRANSITIONS, enrollment.status)
    : [];

  async function handleConfirm() {
    if (!enrollment || !selected) return;

    try {
      await toast
        .promise(
          updateMut.mutateAsync({ id: enrollment.id, status: selected }),
          {
            loading: t("common.loading"),
            success: t("enrollments.statusUpdated"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("enrollments.statusUpdateFailed"),
          },
        )
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.enrollments.pathKey(),
      });
      onUpdated?.();
      onOpenChange(false);
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("enrollments.changeStatus")}</DialogTitle>
          <DialogDescription>
            {enrollment
              ? t("enrollments.changeStatusDescription", {
                  name: enrollment.traineeName,
                })
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {options.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("enrollments.noTransitions")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={selected === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelected(status)}
                  disabled={updateMut.isPending}
                >
                  <EnrollmentStatusTag status={status} />
                </Button>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMut.isPending}
          >
            <XIcon className="size-3.5" />
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selected || updateMut.isPending}
          >
            {updateMut.isPending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <CheckIcon className="size-3.5" />
            )}
            {t("actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
