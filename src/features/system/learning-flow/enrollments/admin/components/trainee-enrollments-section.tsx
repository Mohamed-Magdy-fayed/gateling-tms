"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCapIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { EnrollmentFormDialog } from "./enrollment-form-dialog";
import { EnrollmentLevelsSection } from "./enrollment-levels-section";
import { EnrollmentStatusDialog } from "./enrollment-status-dialog";
import { EnrollmentStatusTag } from "./enrollment-status-tag";
import type { EnrollmentListRow } from "./enrollments-table-columns";

/** One trainee's enrollments, each expandable to its level progress. */
export function TraineeEnrollmentsSection({
  traineeId,
}: {
  traineeId: string;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<EnrollmentListRow | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery(
    trpc.enrollments.list.queryOptions({
      page: 1,
      perPage: 50,
      sorting: [],
      traineeId,
    }),
  );

  const enrollments = data?.rows ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("enrollments.title")}</CardTitle>
        <CardDescription>{t("enrollments.lead")}</CardDescription>
        <CardAction>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("enrollments.add")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon={<GraduationCapIcon />}
            title={t("enrollments.emptyTitle")}
            description={t("enrollments.emptyDescription")}
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon className="size-3.5" />
                {t("enrollments.add")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/content-library/courses/${enrollment.courseId}`}
                    className="min-w-0 truncate font-medium text-sm underline-offset-4 hover:underline"
                  >
                    {enrollment.courseName}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <EnrollmentStatusTag status={enrollment.status} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusTarget(enrollment)}
                    >
                      {t("enrollments.changeStatus")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === enrollment.id ? null : enrollment.id,
                        )
                      }
                    >
                      {t("enrollments.levels.title")}
                    </Button>
                  </div>
                </div>

                {expandedId === enrollment.id ? (
                  <EnrollmentLevelsSection enrollmentId={enrollment.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <EnrollmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        traineeId={traineeId}
      />
      <EnrollmentStatusDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        enrollment={statusTarget}
        onUpdated={() => setStatusTarget(null)}
      />
    </Card>
  );
}
