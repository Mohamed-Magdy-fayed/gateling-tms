"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, PencilIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/features/core/i18n/client";
import { GroupProgressSection } from "@/features/system/learning-flow/progress/admin";
import { useTRPC } from "@/integrations/trpc/client";
import {
  GroupFormDialog,
  GroupSessionsSection,
  GroupStatusTag,
  GroupStudentsSection,
} from "./components";

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [editOpen, setEditOpen] = useState(false);

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery(trpc.groups.get.queryOptions({ id: groupId }));

  // Sessions are rendered on the academy's clock, which lives on the org.
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Spinner />
      </div>
    );
  }

  // An invalid, deleted, or cross-org group id makes `groups.get` throw
  // NOT_FOUND — render that state instead of silently leaving a blank page.
  if (isError || !group) {
    return (
      <EmptyState
        icon={<SearchXIcon />}
        title={t("groups.notFoundTitle")}
        description={t("groups.notFoundDescription")}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href="/learning-flow/groups" />}
          >
            <ArrowLeftIcon className="size-3.5" />
            {t("groups.title")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/learning-flow/groups" />}
        >
          <ArrowLeftIcon className="size-3.5" />
          {t("groups.title")}
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display font-bold text-2xl text-foreground">
            {group.name}
          </h1>
          <GroupStatusTag status={group.status} />
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

        <p className="mt-1 text-muted-foreground text-sm">
          {group.courseName ?? t("groups.noCourse")} ·{" "}
          {group.teacherName ?? t("groups.noTeacher")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GroupStudentsSection groupId={group.id} />
        <GroupSessionsSection
          groupId={group.id}
          hasSchedule={group.schedule.length > 0}
          timeZone={organization?.timeZone ?? "UTC"}
        />
      </div>

      <GroupProgressSection groupId={group.id} />

      <GroupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={group}
      />
    </div>
  );
}
