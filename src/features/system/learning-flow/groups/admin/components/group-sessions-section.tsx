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
  /** Whether the group has any weekly slots at all. Distinguishes "nothing to
   * generate from" from "generation hasn't finished yet" — see below. */
  hasSchedule: boolean;
  /** The org's IANA zone — sessions are displayed on the academy's clock,
   * not the viewer's, so a teacher abroad still reads the local class time. */
  timeZone: string;
};

/** How often to re-check while generation is expected but hasn't landed. */
const PENDING_POLL_MS = 3000;

export function GroupSessionsSection({
  groupId,
  hasSchedule,
  timeZone,
}: GroupSessionsSectionProps) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const { data: sessions, isLoading } = useQuery({
    ...trpc.groups.sessions.queryOptions({ id: groupId }),
    // Generation runs through Inngest, so an empty list right after saving a
    // schedule means "not yet", not "never". Poll until the first session
    // shows up, then stop — no reason to keep hitting the server once the
    // list is populated or the group has no slots to generate from.
    refetchInterval: (query) => {
      const rows = query.state.data;
      return hasSchedule && rows && rows.length === 0 ? PENDING_POLL_MS : false;
    },
  });

  // An empty list means two very different things depending on whether any
  // slots exist. Telling someone who just saved a schedule to "add a slot"
  // reads as though their save was lost.
  const isPending = hasSchedule && sessions?.length === 0;

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
        ) : isPending ? (
          <EmptyState
            icon={<Spinner />}
            title={t("groups.sessions.pending")}
            description={t("groups.sessions.lead")}
          />
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
