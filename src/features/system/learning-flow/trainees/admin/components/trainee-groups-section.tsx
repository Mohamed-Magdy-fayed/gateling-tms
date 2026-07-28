"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
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
import { GroupStatusTag } from "@/features/system/learning-flow/groups/admin/components";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * Read-only: a trainee joins a group from the group's own roster screen, which
 * is where the "create a trainee on the spot" flow already lives.
 */
export function TraineeGroupsSection({ traineeId }: { traineeId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const { data: groups, isLoading } = useQuery(
    trpc.trainees.groups.queryOptions({ id: traineeId }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groups.title")}</CardTitle>
        <CardDescription>{t("trainees.groupsLead")}</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !groups || groups.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={t("trainees.groupsEmptyTitle")}
            description={t("trainees.groupsEmptyDescription")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {groups.map((group) => (
              <li
                key={group.groupId}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/learning-flow/groups/${group.groupId}`}
                    className="truncate font-medium text-sm underline-offset-4 hover:underline"
                  >
                    {group.name}
                  </Link>
                  <p className="truncate text-muted-foreground text-xs">
                    {group.courseName ?? t("groups.noCourse")}
                  </p>
                </div>
                <GroupStatusTag status={group.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
