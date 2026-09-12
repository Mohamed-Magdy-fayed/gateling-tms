"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  Link2Icon,
  Loader2Icon,
  VideoIcon,
  VideoOffIcon,
} from "lucide-react";
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
    | "id"
    | "joinUrl"
    | "joinPath"
    | "status"
    | "hasMeeting"
    | "canStart"
    | "isHost"
  >;
  /** Whether this deployment has Gateling Meetings configured at all. */
  liveClassesEnabled: boolean;
  /**
   * Whether to offer the share link. Staff paste it into the class group for
   * students who have no account here; a signed-in student already gets in
   * through their own "Join".
   */
  canShareLink?: boolean;
};

/** How long the copy button shows its "copied" state. */
const COPIED_FEEDBACK_MS = 2_000;

/**
 * What a viewer can do with one session's meeting.
 *
 * Meetings are created on demand (STATE.md D143), so a host gets a **button
 * that creates one** and everyone else waits for them — which is why a row
 * has three no-link states, and they read very differently to whoever is
 * looking:
 *
 * - live classes not configured on this deployment → classes don't run here
 * - configured, nobody started → a host can start it, a student waits
 * - started → "Start class" for the host, "Join" for everyone else
 *
 * Both of those are plain links to the session's `/join` route: the server
 * mints a fresh signed link per click and redirects, so nothing here ever
 * holds a meeting URL that could go stale. Who is host is decided server-side
 * (`isHost`); this component shows what the caller was given.
 */
export function SessionJoinActions({
  session,
  liveClassesEnabled,
  canShareLink = false,
}: SessionJoinActionsProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);

  const startMut = useMutation(trpc.sessions.startMeeting.mutationOptions());

  if (session.status === "cancelled") return null;

  if (session.hasMeeting) {
    return (
      <>
        <Button
          size="sm"
          variant={session.isHost ? "default" : "outline"}
          render={
            <a href={session.joinPath} target="_blank" rel="noreferrer">
              <VideoIcon className="size-3.5" />
              {t(session.isHost ? "sessions.start" : "sessions.join")}
            </a>
          }
        />
        {canShareLink && session.joinUrl ? (
          <CopyLinkButton url={session.joinUrl} />
        ) : null}
      </>
    );
  }

  async function handleStart() {
    setStarting(true);
    try {
      const { joinPath } = await startMut.mutateAsync({ id: session.id });
      await queryClient.invalidateQueries({
        queryKey: trpc.sessions.pathKey(),
      });
      toast.success(t("sessions.started"));
      // Opened after the mutation resolves rather than optimistically: a
      // pop-up blocked here is recoverable (the row now shows the link), but
      // a tab opened before the meeting existed would land on an error.
      window.open(joinPath, "_blank", "noreferrer");
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

  if (liveClassesEnabled && session.canStart) {
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
      {!liveClassesEnabled
        ? t("sessions.offline")
        : session.canStart
          ? t("sessions.notStarted")
          : t("sessions.waitingForHost")}
    </Tag>
  );
}

/**
 * Copies the meeting's plain share link. It is the one meeting URL that is
 * safe to hand around — passcode-free, and the waiting room is off for
 * classes — so a student without an account can still get in from WhatsApp.
 */
function CopyLinkButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      toast.error(t("sessions.copyLinkFailed"));
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      aria-label={t("sessions.copyLink")}
      title={t("sessions.copyLink")}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <Link2Icon className="size-3.5" />
      )}
      {copied ? t("sessions.copied") : t("sessions.copyLink")}
    </Button>
  );
}
