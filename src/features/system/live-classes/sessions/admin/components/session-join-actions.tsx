"use client";

import { VideoIcon, VideoOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";

type SessionJoinActionsProps = {
  session: Pick<SessionRow, "joinUrl" | "startUrl" | "status">;
  /** Whether the org has a connected Zoom account at all. */
  hasActiveZoomClient: boolean;
};

/**
 * What a viewer can do with one session's Zoom meeting.
 *
 * `startUrl` is only ever present for the teacher running the class and for
 * admins (server-side rule, lib/session-links.ts) — this component doesn't
 * decide who hosts, it just shows what the caller was given.
 *
 * A session with no meeting is not an error: an org that never connects Zoom
 * still schedules classes, and the two reasons a link is missing read very
 * differently to whoever is looking at the row.
 */
export function SessionJoinActions({
  session,
  hasActiveZoomClient,
}: SessionJoinActionsProps) {
  const { t } = useTranslation();

  if (session.status === "cancelled") return null;

  if (session.startUrl) {
    return (
      <Button
        size="sm"
        render={
          <a href={session.startUrl} target="_blank" rel="noreferrer">
            <VideoIcon className="size-3.5" />
            {t("sessions.start")}
          </a>
        }
      />
    );
  }

  if (session.joinUrl) {
    return (
      <Button
        size="sm"
        variant="outline"
        render={
          <a href={session.joinUrl} target="_blank" rel="noreferrer">
            <VideoIcon className="size-3.5" />
            {t("sessions.join")}
          </a>
        }
      />
    );
  }

  return (
    <Tag color="neutral">
      <VideoOffIcon className="size-3.5" />
      {hasActiveZoomClient ? t("sessions.preparing") : t("sessions.offline")}
    </Tag>
  );
}
