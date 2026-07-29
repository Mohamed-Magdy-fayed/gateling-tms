"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import type { AttendanceRow } from "@/features/system/live-classes/attendance/server";
import { useTRPC } from "@/integrations/trpc/client";

type AttendanceRowActionsProps = {
  sessionId: string;
  row: AttendanceRow;
};

/**
 * The teacher's override for one trainee (phase-06.md step 6).
 *
 * Two plain buttons rather than a toggle: the current record may be nothing at
 * all, and "present" and "absent" are both statements someone has to make
 * deliberately — a toggle would imply a default that was never recorded.
 */
export function AttendanceRowActions({
  sessionId,
  row,
}: AttendanceRowActionsProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const markMut = useMutation(trpc.attendance.mark.mutationOptions());
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(
    null,
  );

  async function mark(status: AttendanceStatus) {
    setPendingStatus(status);
    try {
      await toast
        .promise(
          markMut.mutateAsync({ sessionId, traineeId: row.traineeId, status }),
          {
            loading: t("common.loading"),
            success: t("attendance.marked"),
            error: (error) =>
              error instanceof Error
                ? error.message
                : t("attendance.markFailed"),
          },
        )
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.attendance.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={row.status === "present" ? "default" : "outline"}
        disabled={pendingStatus !== null}
        onClick={() => mark("present")}
      >
        <CheckIcon className="size-3.5" />
        {t("attendance.statusOptions.present")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={row.status === "absent" ? "default" : "outline"}
        disabled={pendingStatus !== null}
        onClick={() => mark("absent")}
      >
        <XIcon className="size-3.5" />
        {t("attendance.statusOptions.absent")}
      </Button>
    </div>
  );
}
