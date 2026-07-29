"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheckIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { EnrollmentStatusTag } from "@/features/system/learning-flow/enrollments/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { ProgressMeter } from "./progress-meter";
import { useOrgDateTimeFormat } from "./use-org-date-time-format";

export function GroupProgressSection({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const { data: progress, isLoading } = useQuery(
    trpc.progress.group.queryOptions({ groupId }),
  );

  const dateTimeFmt = useOrgDateTimeFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("progress.title")}</CardTitle>
        <CardDescription>{t("progress.groupLead")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading || !progress ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
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

            {progress.students.length === 0 ? (
              <EmptyState
                icon={<TrendingUpIcon />}
                title={t("progress.emptyTitle")}
                description={t("progress.groupEmptyDescription")}
              />
            ) : (
              <ul className="divide-y divide-border border-t">
                {progress.students.map((student) => (
                  <li key={student.traineeId} className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/learning-flow/trainees/${student.traineeId}`}
                        className="truncate font-medium text-sm underline-offset-4 hover:underline"
                      >
                        {student.traineeName}
                      </Link>
                      {student.status ? (
                        <EnrollmentStatusTag status={student.status} />
                      ) : (
                        // On the roster without an enrollment is a normal
                        // state, not a gap: group membership works without one
                        // (phase-05.md step 4).
                        <span className="text-muted-foreground text-xs">
                          {t("progress.notEnrolled")}
                        </span>
                      )}
                    </div>

                    {student.levels ? (
                      <ProgressMeter
                        label={t("progress.levels")}
                        detail={t("progress.levelsDetail", {
                          completed: student.levels.completed,
                          total: student.levels.total,
                        })}
                        percent={student.levels.percentComplete}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-muted-foreground text-xs">
              {t("progress.attendanceNote")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
