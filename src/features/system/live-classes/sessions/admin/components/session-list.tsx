"use client";

import { ClipboardListIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { SessionJoinActions } from "./session-join-actions";
import { SessionStatusTag } from "./session-status-tag";

type SessionListProps = {
  sessions: SessionRow[];
  hasActiveMeetingAccount: boolean;
  /** The org's IANA zone — sessions read on the academy's clock, not the
   * viewer's, so a teacher abroad still sees the local class time. */
  timeZone: string;
  /** Off on a group's own page, where every row is the same class. */
  showGroup?: boolean;
  /**
   * Whether to offer the register. The attendance routes are staff-only
   * (`attendance/server/router.ts`), so a student is not sent to a page that
   * can only answer FORBIDDEN.
   */
  canOpenRegister?: boolean;
};

export function SessionList({
  sessions,
  hasActiveMeetingAccount,
  timeZone,
  showGroup = false,
  canOpenRegister = false,
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

          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusTag status={session.status} />
            <SessionJoinActions
              session={session}
              hasActiveMeetingAccount={hasActiveMeetingAccount}
            />
            {canOpenRegister ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/live-classes/sessions/${session.id}`} />}
              >
                <ClipboardListIcon className="size-3.5" />
                {t("sessions.register")}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
