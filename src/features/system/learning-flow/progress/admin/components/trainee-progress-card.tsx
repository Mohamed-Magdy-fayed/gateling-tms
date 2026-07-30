"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheckIcon, TrendingUpIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { Spinner } from "@/components/ui/spinner";
import type { EnrollmentStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { EnrollmentStatusTag } from "@/features/system/learning-flow/enrollments/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { useOrgDateTimeFormat } from "./use-org-date-time-format";

// Only the statuses worth a tile on a summary card — `cancelled` and
// `postponed` are visible in the enrollments list right below this one.
const HIGHLIGHTED_STATUSES = [
  "ongoing",
  "completed",
  "waiting",
] as const satisfies readonly EnrollmentStatus[];

export function TraineeProgressCard({ traineeId }: { traineeId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const { data: progress, isLoading } = useQuery(
    trpc.progress.trainee.queryOptions({ traineeId }),
  );

  const dateTimeFmt = useOrgDateTimeFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("progress.title")}</CardTitle>
        <CardDescription>{t("progress.traineeLead")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading || !progress ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : progress.enrollments.total === 0 &&
          progress.sessions.total === 0 ? (
          <EmptyState
            icon={<TrendingUpIcon />}
            title={t("progress.emptyTitle")}
            description={t("progress.traineeEmptyDescription")}
          />
        ) : (
          <>
            {/* The existing status tag is reused rather than re-coloured, so a
                status reads the same here as it does in the enrollments list. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {HIGHLIGHTED_STATUSES.map((status) => (
                <span key={status} className="flex items-center gap-1.5">
                  <EnrollmentStatusTag status={status} />
                  <span className="font-display font-bold text-foreground text-sm">
                    {progress.enrollments.byStatus[status]}
                  </span>
                </span>
              ))}
            </div>

            <ProgressMeter
              label={t("progress.levels")}
              detail={t("progress.levelsDetail", {
                completed: progress.levels.completed,
                total: progress.levels.total,
              })}
              percent={progress.levels.percentComplete}
            />

            <ProgressMeter
              label={t("progress.sessions")}
              detail={t("progress.sessionsDetail", {
                completed: progress.sessions.completed,
                total: progress.sessions.total,
              })}
              percent={progress.sessions.percentComplete}
            />

            {progress.sessions.nextAt ? (
              <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <CalendarCheckIcon className="size-3.5" />
                {t("progress.nextSession", {
                  when: dateTimeFmt.format(progress.sessions.nextAt),
                })}
              </p>
            ) : null}

            {/* Attendance is a separate measurement from "classes held", and
                only classes with something recorded count — a class nobody
                marked is not evidence this trainee missed it. */}
            {progress.sessions.attendance.recorded > 0 ? (
              <ProgressMeter
                label={t("progress.attendance")}
                detail={t("progress.attendanceDetail", {
                  attended: progress.sessions.attendance.attended,
                  recorded: progress.sessions.attendance.recorded,
                })}
                percent={progress.sessions.attendance.percentAttended}
              />
            ) : (
              <p className="text-muted-foreground text-xs">
                {t("progress.attendanceNone")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
