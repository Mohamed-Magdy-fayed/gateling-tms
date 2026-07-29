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
import { SessionList } from "@/features/system/live-classes/sessions/admin";
import { useTRPC } from "@/integrations/trpc/client";

type GroupSessionsSectionProps = {
  groupId: string;
  /** Whether the group has any weekly slots at all. Distinguishes "nothing to
   * generate from" from "generation hasn't finished yet" — see below. */
  hasSchedule: boolean;
  /** The org's IANA zone — sessions are displayed on the academy's clock,
   * not the viewer's, so a teacher abroad still reads the local class time. */
  timeZone: string;
  /** Whether to link each row to its register — staff only, since the
   * attendance routes refuse a student (`attendance/server/router.ts`). */
  canOpenRegister: boolean;
};

/** How often to re-check while generation is expected but hasn't landed. */
const PENDING_POLL_MS = 3000;

export function GroupSessionsSection({
  groupId,
  hasSchedule,
  timeZone,
  canOpenRegister,
}: GroupSessionsSectionProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  // `sessions.byGroup`, not a groups-owned query: these rows carry the Zoom
  // join links, and the rules for who may see a host link live with the rest
  // of the meeting code (live-classes/sessions).
  const { data, isLoading } = useQuery({
    ...trpc.sessions.byGroup.queryOptions({ groupId }),
    // Generation runs through Inngest, so an empty list right after saving a
    // schedule means "not yet", not "never". Poll until the first session
    // shows up, then stop — no reason to keep hitting the server once the
    // list is populated or the group has no slots to generate from.
    refetchInterval: (query) => {
      const rows = query.state.data?.rows;
      return hasSchedule && rows && rows.length === 0 ? PENDING_POLL_MS : false;
    },
  });

  // An empty list means two very different things depending on whether any
  // slots exist. Telling someone who just saved a schedule to "add a slot"
  // reads as though their save was lost.
  const isPending = hasSchedule && data?.rows.length === 0;

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
        ) : !data || data.rows.length === 0 ? (
          <EmptyState
            icon={<CalendarDaysIcon />}
            title={t("groups.sessions.emptyTitle")}
            description={t("groups.sessions.emptyDescription")}
          />
        ) : (
          <SessionList
            sessions={data.rows}
            hasActiveZoomClient={data.hasActiveZoomClient}
            timeZone={timeZone}
            canOpenRegister={canOpenRegister}
          />
        )}
      </CardContent>
    </Card>
  );
}
