"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, SearchXIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import {
  SessionJoinActions,
  SessionStatusTag,
} from "@/features/system/live-classes/sessions/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { AttendanceRowActions, AttendanceStatusTag } from "./components";

/**
 * One class: when it runs, how to get into it, and who was there.
 *
 * The register is the point of the page. Everything happening *in* the class —
 * the video, the whiteboard, the recording — happens in onMeeting (D8); what this
 * screen owns is the schedule, the links, and the record of who attended.
 */
export function SessionAttendancePage({ sessionId }: { sessionId: string }) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery(
    trpc.attendance.bySession.queryOptions({ sessionId }),
  );

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

  // A deleted, cross-org, or simply wrong session id makes the query throw
  // NOT_FOUND — say so rather than rendering an empty register, which would
  // read as "nobody attended".
  if (isError || !data) {
    return (
      <EmptyState
        icon={<SearchXIcon />}
        title={t("attendance.notFoundTitle")}
        description={t("attendance.notFoundDescription")}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href="/live-classes/sessions" />}
          >
            <ArrowLeftIcon className="size-3.5 rtl:rotate-180" />
            {t("sessions.title")}
          </Button>
        }
      />
    );
  }

  const { session, rows } = data;
  // The academy's clock, not the viewer's — a teacher abroad still reads the
  // local class time.
  const dateTimeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone: organization?.timeZone ?? "UTC",
    dateStyle: "full",
    timeStyle: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone: organization?.timeZone ?? "UTC",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ms-2"
          render={<Link href="/live-classes/sessions" />}
        >
          <ArrowLeftIcon className="size-3.5 rtl:rotate-180" />
          {t("sessions.title")}
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-bold font-display text-2xl text-foreground">
            {dateTimeFmt.format(session.scheduledAt)}
          </h1>
          <SessionStatusTag status={session.status} />
          <div className="ms-auto">
            <SessionJoinActions
              session={session}
              hasActiveMeetingAccount={data.hasActiveMeetingAccount}
            />
          </div>
        </div>

        <p className="mt-1 text-muted-foreground text-sm">
          <Link
            className="hover:underline"
            href={`/learning-flow/groups/${session.groupId}`}
          >
            {session.groupName}
          </Link>
          {" · "}
          {t("groups.sessions.durationValue", {
            minutes: session.durationMinutes,
          })}
          {session.teacherName ? ` · ${session.teacherName}` : null}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("attendance.title")}</CardTitle>
          <CardDescription>{t("attendance.lead")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={<UsersIcon />}
              title={t("attendance.emptyTitle")}
              description={t("attendance.emptyDescription")}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/learning-flow/groups/${session.groupId}`} />
                  }
                >
                  {t("attendance.openGroup")}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.traineeId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {row.traineeName}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      {row.joinedAt
                        ? t("attendance.joinedAt", {
                            time: timeFmt.format(row.joinedAt),
                          })
                        : t("attendance.notMarkedYet")}
                      {row.attendedMinutes > 0
                        ? ` · ${t("groups.sessions.durationValue", {
                            minutes: row.attendedMinutes,
                          })}`
                        : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Their record stays on the class they actually sat in,
                        and stays correctable, even after they move on. */}
                    {row.onRoster ? null : (
                      <Tag color="neutral">{t("attendance.leftTheClass")}</Tag>
                    )}
                    {row.source === "manual" ? (
                      <Tag color="violet">{t("attendance.markedManually")}</Tag>
                    ) : null}
                    <AttendanceStatusTag status={row.status} />
                    {data.canMark ? (
                      <AttendanceRowActions sessionId={session.id} row={row} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
