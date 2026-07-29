"use client";

import Link from "next/link";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { SessionJoinActions } from "./session-join-actions";
import { SessionStatusTag } from "./session-status-tag";

type SessionListProps = {
  sessions: SessionRow[];
  hasActiveZoomClient: boolean;
  /** The org's IANA zone — sessions read on the academy's clock, not the
   * viewer's, so a teacher abroad still sees the local class time. */
  timeZone: string;
  /** Off on a group's own page, where every row is the same class. */
  showGroup?: boolean;
};

export function SessionList({
  sessions,
  hasActiveZoomClient,
  timeZone,
  showGroup = false,
}: SessionListProps) {
  const { t, locale } = useTranslation();

  const dateTimeFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <ul className="divide-y divide-border">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">
              {dateTimeFmt.format(session.scheduledAt)}
            </p>
            <p className="truncate text-muted-foreground text-xs">
              {showGroup ? (
                <Link
                  className="hover:underline"
                  href={`/learning-flow/groups/${session.groupId}`}
                >
                  {session.groupName}
                </Link>
              ) : null}
              {showGroup ? " · " : null}
              {t("groups.sessions.durationValue", {
                minutes: session.durationMinutes,
              })}
              {session.teacherName ? ` · ${session.teacherName}` : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SessionStatusTag status={session.status} />
            <SessionJoinActions
              session={session}
              hasActiveZoomClient={hasActiveZoomClient}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
