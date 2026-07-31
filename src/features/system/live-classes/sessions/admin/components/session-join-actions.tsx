"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, VideoIcon, VideoOffIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { useTRPC } from "@/integrations/trpc/client";

type SessionJoinActionsProps = {
  session: Pick<
    SessionRow,
    "id" | "joinUrl" | "startUrl" | "status" | "hasMeeting" | "canStart"
  >;
  /** Whether the org has a connected onMeeting room at all. */
  hasActiveMeetingAccount: boolean;
};

/**
 * What a viewer can do with one session's meeting.
 *
 * Under Zoom, a meeting existed from the moment the schedule was saved and
 * this component only ever handed out links. onMeeting meetings are created on
 * demand (STATE.md D143), so a host now gets a **button that creates one** and
 * everyone else waits for them — which is why the row has three no-link states
 * rather than two, and they read very differently to whoever is looking:
 *
 * - no room connected at all → this academy doesn't run classes here
 * - room connected, nobody started → a host can start it, a student waits
 * - started → a join link for everyone, a host link for the host
 *
 * `startUrl` is only ever present for the teacher running the class and for
 * admins (server-side rule, lib/session-links.ts); this component doesn't
 * decide who hosts, it shows what the caller was given.
 */
export function SessionJoinActions({
  session,
  hasActiveMeetingAccount,
}: SessionJoinActionsProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);

  const startMut = useMutation(trpc.sessions.startMeeting.mutationOptions());

  if (session.status === "cancelled") return null;

  // Already running: the host opens their own link, everyone else joins.
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

  async function handleStart() {
    setStarting(true);
    try {
      const { startUrl } = await startMut.mutateAsync({ id: session.id });
      await queryClient.invalidateQueries({
        queryKey: trpc.sessions.pathKey(),
      });
      toast.success(t("sessions.started"));
      // Opened after the mutation resolves rather than optimistically: a
      // pop-up blocked here is recoverable (the row now shows the link), but
      // a tab opened before the meeting existed would land nowhere.
      window.open(startUrl, "_blank", "noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("sessions.errors.startFailed"),
      );
    } finally {
      setStarting(false);
    }
  }

  if (hasActiveMeetingAccount && session.canStart && !session.hasMeeting) {
    return (
      <Button size="sm" disabled={starting} onClick={handleStart}>
        {starting ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <VideoIcon className="size-3.5" />
        )}
        {starting ? t("sessions.starting") : t("sessions.start")}
      </Button>
    );
  }

  return (
    <Tag color="neutral">
      <VideoOffIcon className="size-3.5" />
      {!hasActiveMeetingAccount
        ? t("sessions.offline")
        : session.canStart
          ? t("sessions.notStarted")
          : t("sessions.waitingForHost")}
    </Tag>
  );
}
