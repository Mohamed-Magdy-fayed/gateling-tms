"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PencilIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { TraineeCertificatesSection } from "@/features/system/learning-flow/certificates/admin";
import { TraineeEnrollmentsSection } from "@/features/system/learning-flow/enrollments/admin";
import { TraineePlacementTestsSection } from "@/features/system/learning-flow/placement-tests/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { TraineeFormDialog, TraineeGroupsSection } from "./components";

export function TraineeDetailPage({ traineeId }: { traineeId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [editOpen, setEditOpen] = useState(false);

  const {
    data: trainee,
    isLoading,
    isError,
  } = useQuery(trpc.trainees.get.queryOptions({ id: traineeId }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Spinner />
      </div>
    );
  }

  // An invalid, deleted, or cross-org trainee id makes `trainees.get` throw
  // NOT_FOUND — render that state instead of silently leaving a blank page.
  if (isError || !trainee) {
    return (
      <EmptyState
        icon={<SearchXIcon />}
        title={t("trainees.notFoundTitle")}
        description={t("trainees.notFoundDescription")}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href="/learning-flow/trainees" />}
          >
            <ArrowLeftIcon className="size-3.5" />
            {t("trainees.title")}
          </Button>
        }
      />
    );
  }

  const contactLine = [trainee.email, trainee.phone]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/learning-flow/trainees" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          {t("trainees.title")}
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display font-bold text-2xl text-foreground">
            {trainee.name}
          </h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto"
            onClick={() => setEditOpen(true)}
          >
            <PencilIcon className="size-3.5" />
            {t("actions.edit")}
          </Button>
        </div>

        {contactLine ? (
          <p className="mt-1 text-muted-foreground text-sm">{contactLine}</p>
        ) : null}
      </div>

      <TraineeEnrollmentsSection traineeId={trainee.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TraineePlacementTestsSection
          traineeId={trainee.id}
          traineeName={trainee.name}
        />
        <TraineeGroupsSection traineeId={trainee.id} />
      </div>

      <TraineeCertificatesSection traineeId={trainee.id} />

      <TraineeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        trainee={trainee}
      />
    </div>
  );
}
