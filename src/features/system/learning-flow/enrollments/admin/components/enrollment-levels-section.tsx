"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayersIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  type EnrollmentLevelStatus,
  enrollmentLevelStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { EnrollmentLevelStatusTag } from "./enrollment-status-tag";

/**
 * A level with no `enrollment_levels` row yet reads as `notStarted` — the query
 * drives off the course's levels, so nothing has to be seeded when a trainee
 * enrolls (see `listEnrollmentLevels`).
 */
export function EnrollmentLevelsSection({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: levels, isLoading } = useQuery(
    trpc.enrollments.levels.queryOptions({ id: enrollmentId }),
  );
  const setStatusMut = useMutation(
    trpc.enrollments.setLevelStatus.mutationOptions(),
  );
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  // Pinned to the academy's clock so the server and the browser can't format
  // the same completion date into different days (a hydration mismatch, and
  // wrong either side of midnight).
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeZone: organization?.timeZone ?? "UTC",
      }),
    [locale, organization?.timeZone],
  );

  async function handleChange(levelId: string, status: EnrollmentLevelStatus) {
    try {
      await toast
        .promise(setStatusMut.mutateAsync({ enrollmentId, levelId, status }), {
          loading: t("common.loading"),
          success: t("enrollments.levels.updated"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("enrollments.levels.updateFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.enrollments.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("enrollments.levels.title")}</CardTitle>
        <CardDescription>{t("enrollments.levels.lead")}</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !levels || levels.length === 0 ? (
          <EmptyState
            icon={<LayersIcon />}
            title={t("enrollments.levels.emptyTitle")}
            description={t("enrollments.levels.emptyDescription")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {levels.map((level) => {
              const status = level.status ?? "notStarted";
              return (
                <li
                  key={level.levelId}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{level.name}</p>
                    {level.completedAt ? (
                      <p className="truncate text-muted-foreground text-xs">
                        {t("enrollments.levels.completedOn", {
                          date: dateFmt.format(level.completedAt),
                        })}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <EnrollmentLevelStatusTag status={status} />
                    <Select
                      value={status}
                      disabled={setStatusMut.isPending}
                      onValueChange={(next) =>
                        void handleChange(
                          level.levelId,
                          next as EnrollmentLevelStatus,
                        )
                      }
                    >
                      <SelectTrigger
                        className="w-40"
                        aria-label={t("enrollments.levels.title")}
                      >
                        {/* Base-UI's SelectValue renders the raw value, not
                            the matching item's children — without this mapper
                            the trigger would show "inProgress". */}
                        <SelectValue>
                          {(selected) =>
                            t(
                              `enrollments.levels.statusOptions.${
                                (selected as EnrollmentLevelStatus) ??
                                "notStarted"
                              }`,
                            )
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {enrollmentLevelStatusValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`enrollments.levels.statusOptions.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
