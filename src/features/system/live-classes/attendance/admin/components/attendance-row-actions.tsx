"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ClockIcon, XIcon } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AttendanceStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { MAX_LATE_MINUTES } from "@/features/system/live-classes/attendance/lib/meeting-attendance";
import type { AttendanceRow } from "@/features/system/live-classes/attendance/server";
import { useTRPC } from "@/integrations/trpc/client";

type AttendanceRowActionsProps = {
  sessionId: string;
  row: AttendanceRow;
};

type Verdict = "present" | "late" | "absent";

/** A starting guess for the minutes box when nothing is recorded yet. */
const DEFAULT_LATE_MINUTES = 5;

/**
 * The teacher's override for one trainee (phase-06.md step 6).
 *
 * Three plain buttons rather than a toggle: the current record may be nothing
 * at all, and each verdict is a statement someone has to make deliberately.
 * "Late" is a presence with a number attached, so it asks for the minutes
 * before saving; "Present" means on time and clears any lateness.
 */
export function AttendanceRowActions({
  sessionId,
  row,
}: AttendanceRowActionsProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const markMut = useMutation(trpc.attendance.mark.mutationOptions());
  const [pending, setPending] = useState<Verdict | null>(null);
  const [lateOpen, setLateOpen] = useState(false);
  const minutesId = useId();

  const current: Verdict | null =
    row.status === "present" && row.lateMinutes > 0 ? "late" : row.status;

  async function mark(
    verdict: Verdict,
    status: AttendanceStatus,
    lateMinutes?: number,
  ) {
    setPending(verdict);
    try {
      await toast
        .promise(
          markMut.mutateAsync({
            sessionId,
            traineeId: row.traineeId,
            status,
            lateMinutes,
          }),
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
      setLateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: trpc.attendance.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      setPending(null);
    }
  }

  function submitLate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = Number(new FormData(event.currentTarget).get("minutes"));
    if (!Number.isInteger(minutes) || minutes < 1) return;
    void mark("late", "present", Math.min(minutes, MAX_LATE_MINUTES));
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={current === "present" ? "default" : "outline"}
        disabled={pending !== null}
        onClick={() => mark("present", "present", 0)}
      >
        <CheckIcon className="size-3.5" />
        {t("attendance.statusOptions.present")}
      </Button>

      <Popover open={lateOpen} onOpenChange={setLateOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              size="sm"
              variant={current === "late" ? "default" : "outline"}
              disabled={pending !== null}
            />
          }
        >
          <ClockIcon className="size-3.5" />
          {t("attendance.statusOptions.late")}
        </PopoverTrigger>
        <PopoverContent className="w-56" align="end">
          <form className="flex flex-col gap-2" onSubmit={submitLate}>
            <Label htmlFor={minutesId}>
              {t("attendance.lateMinutesLabel")}
            </Label>
            <Input
              id={minutesId}
              name="minutes"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={MAX_LATE_MINUTES}
              step={1}
              defaultValue={row.lateMinutes || DEFAULT_LATE_MINUTES}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={pending !== null}>
              {t("attendance.saveLate")}
            </Button>
          </form>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="sm"
        variant={current === "absent" ? "default" : "outline"}
        disabled={pending !== null}
        onClick={() => mark("absent", "absent")}
      >
        <XIcon className="size-3.5" />
        {t("attendance.statusOptions.absent")}
      </Button>
    </div>
  );
}
