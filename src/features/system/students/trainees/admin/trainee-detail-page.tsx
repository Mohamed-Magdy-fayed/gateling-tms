"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  SearchXIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { TraineeCertificatesSection } from "@/features/system/students/certificates/admin";
import { TraineeEnrollmentsSection } from "@/features/system/students/enrollments/admin";
import { TraineeNotesSection } from "@/features/system/students/notes/admin";
import { TraineePaymentsSection } from "@/features/system/students/payments/admin";
import { TraineePlacementTestsSection } from "@/features/system/students/placement-tests/admin";
import { TraineeProgressCard } from "@/features/system/students/progress/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { TraineeFormDialog, TraineeGroupsSection } from "./components";

/**
 * The student profile: everything the academy knows about one student, on
 * one page. Notes and payments sit right under the header because they are
 * what staff open the profile for day to day; the learning record (progress,
 * enrollments, placement, groups, certificates) follows.
 */
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
            render={<Link href="/students" />}
          >
            <ArrowLeftIcon className="size-3.5 rtl:rotate-180" />
            {t("trainees.title")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: t("trainees.title"), href: "/students" },
            { label: trainee.name },
          ]}
        />

        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {t("trainees.profile")}
            </p>
            <h1 className="mt-1 font-display font-bold text-2xl text-foreground">
              {trainee.name}
            </h1>
            {trainee.email || trainee.phone ? (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                {trainee.email ? (
                  <a
                    href={`mailto:${trainee.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <MailIcon className="size-3.5" />
                    {trainee.email}
                  </a>
                ) : null}
                {trainee.phone ? (
                  <a
                    href={`tel:${trainee.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                    dir="ltr"
                  >
                    <PhoneIcon className="size-3.5" />
                    {trainee.phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TraineeNotesSection traineeId={trainee.id} />
        <TraineePaymentsSection traineeId={trainee.id} />
      </div>

      <TraineeProgressCard traineeId={trainee.id} />

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
