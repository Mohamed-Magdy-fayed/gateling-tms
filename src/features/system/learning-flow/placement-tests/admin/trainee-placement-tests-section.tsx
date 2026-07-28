"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheckIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import {
  PlacementTestAssignDialog,
  PlacementTestReviewDialog,
  PlacementTestRunnerDialog,
  PlacementTestStatusTag,
} from "./components";

type RunnerTarget = { id: string; formId: string } | null;

export function TraineePlacementTestsSection({
  traineeId,
  traineeName,
}: {
  traineeId: string;
  traineeName: string;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [assignOpen, setAssignOpen] = useState(false);
  const [runnerTarget, setRunnerTarget] = useState<RunnerTarget>(null);
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
  // Tracked per row rather than off the mutation's own isPending, which is
  // shared and would grey out every other row's cancel button too — same
  // pattern as the group roster's remove button.
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: placementTests, isLoading } = useQuery(
    trpc.placementTests.list.queryOptions({ traineeId }),
  );
  // Dates are rendered on the academy's clock, which lives on the org — the
  // same reason the group sessions panel reads it.
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const cancelMut = useMutation(trpc.placementTests.cancel.mutationOptions());

  // Without an explicit time zone the server formats in the host's zone and
  // the browser in the viewer's, which hydrates mismatched and shows the wrong
  // day either side of midnight.
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeZone: organization?.timeZone ?? "UTC",
      }),
    [locale, organization?.timeZone],
  );

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await toast
        .promise(cancelMut.mutateAsync({ id }), {
          loading: t("common.loading"),
          success: t("placementTests.testCancelled"),
          error: (err) =>
            err instanceof Error
              ? err.message
              : t("placementTests.cancelFailed"),
        })
        .unwrap();
      await queryClient.invalidateQueries({
        queryKey: trpc.placementTests.pathKey(),
      });
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("placementTests.title")}</CardTitle>
        <CardDescription>{t("placementTests.lead")}</CardDescription>
        <CardAction>
          <Button type="button" size="sm" onClick={() => setAssignOpen(true)}>
            <PlusIcon className="size-3.5" />
            {t("placementTests.assign")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !placementTests || placementTests.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheckIcon />}
            title={t("placementTests.emptyTitle")}
            description={t("placementTests.emptyDescription")}
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => setAssignOpen(true)}
              >
                <PlusIcon className="size-3.5" />
                {t("placementTests.assign")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {placementTests.map((placementTest) => (
              <li key={placementTest.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {placementTest.formTitle ??
                        t("placementTests.noFormAssigned")}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {placementTest.assignedLevelName ??
                        t("placementTests.noLevel")}
                      {placementTest.completedAt
                        ? ` · ${dateFmt.format(placementTest.completedAt)}`
                        : null}
                    </p>
                  </div>
                  <PlacementTestStatusTag status={placementTest.status} />
                </div>

                {placementTest.responseId ? (
                  <p className="text-muted-foreground text-xs">
                    {t("placementTests.score")}:{" "}
                    {placementTest.score ?? t("placementTests.notScored")}
                  </p>
                ) : null}

                {placementTest.feedback ? (
                  <p className="text-muted-foreground text-xs">
                    {placementTest.feedback}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {placementTest.status === "pending" &&
                  placementTest.formId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setRunnerTarget({
                          id: placementTest.id,
                          // Narrowed by the check above; the column is
                          // nullable because a deleted form nulls it.
                          formId: placementTest.formId as string,
                        })
                      }
                    >
                      <SendIcon className="size-3.5" />
                      {t("placementTests.run")}
                    </Button>
                  ) : null}

                  {placementTest.status === "inProgress" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewTargetId(placementTest.id)}
                    >
                      <PencilIcon className="size-3.5" />
                      {t("placementTests.review")}
                    </Button>
                  ) : null}

                  {placementTest.status === "pending" ||
                  placementTest.status === "inProgress" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={cancellingId === placementTest.id}
                      onClick={() => void handleCancel(placementTest.id)}
                    >
                      {t("placementTests.cancelTest")}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <PlacementTestAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        traineeId={traineeId}
      />

      {runnerTarget ? (
        <PlacementTestRunnerDialog
          open
          onOpenChange={(open) => {
            if (!open) setRunnerTarget(null);
          }}
          placementTestId={runnerTarget.id}
          formId={runnerTarget.formId}
          traineeName={traineeName}
        />
      ) : null}

      {reviewTargetId ? (
        <PlacementTestReviewDialog
          open
          onOpenChange={(open) => {
            if (!open) setReviewTargetId(null);
          }}
          placementTestId={reviewTargetId}
          traineeName={traineeName}
        />
      ) : null}
    </Card>
  );
}
