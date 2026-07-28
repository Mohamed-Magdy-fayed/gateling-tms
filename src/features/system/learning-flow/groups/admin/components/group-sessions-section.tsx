"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon } from "lucide-react";
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
import { useTRPC } from "@/integrations/trpc/client";
import { SessionStatusTag } from "./group-status-tag";

type GroupSessionsSectionProps = {
  groupId: string;
  /** The org's IANA zone — sessions are displayed on the academy's clock,
   * not the viewer's, so a teacher abroad still reads the local class time. */
  timeZone: string;
};

export function GroupSessionsSection({
  groupId,
  timeZone,
}: GroupSessionsSectionProps) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const { data: sessions, isLoading } = useQuery(
    trpc.groups.sessions.queryOptions({ id: groupId }),
  );

  const dateTimeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groups.sessions.title")}</CardTitle>
        <CardDescription>{t("groups.sessions.lead")}</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <EmptyState
            icon={<CalendarDaysIcon />}
            title={t("groups.sessions.emptyTitle")}
            description={t("groups.sessions.emptyDescription")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {dateTimeFmt.format(new Date(session.scheduledAt))}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("groups.sessions.durationValue", {
                      minutes: session.durationMinutes,
                    })}
                  </p>
                </div>
                <SessionStatusTag status={session.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
