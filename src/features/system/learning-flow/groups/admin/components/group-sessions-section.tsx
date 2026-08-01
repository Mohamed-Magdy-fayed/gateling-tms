"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDaysIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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

/**
 * How long to keep calling generation "pending" before calling it stuck.
 *
 * Saving a group now generates its sessions inline, so an empty list is very
 * rarely "not yet" — the poll survives only for the nightly backfill and for a
 * group opened while another tab is regenerating it. Polling forever was the
 * bug this card used to have: it spun on "generating…" indefinitely, which
 * reads as progress and gives nobody anything to do about it.
 */
const PENDING_TIMEOUT_MS = 30_000;

export function GroupSessionsSection({
  groupId,
  hasSchedule,
  timeZone,
  canOpenRegister,
}: GroupSessionsSectionProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Declared before the query so the refetch predicate can read it: giving up
  // has to stop the polling, not just change what is rendered.
  const [hasWaitedTooLong, setHasWaitedTooLong] = useState(false);

  // `sessions.byGroup`, not a groups-owned query: these rows carry the
  // onMeeting join links, and the rules for who may see a host link live with
  // the rest of the meeting code (live-classes/sessions).
  const { data, isLoading, isError } = useQuery({
    ...trpc.sessions.byGroup.queryOptions({ groupId }),
    // Generation usually runs through Inngest, so an empty list right after
    // saving a schedule means "not yet", not "never" — but only for as long as
    // waiting is still plausible. A group whose generation is genuinely broken
    // would otherwise refetch every 3s for as long as the tab stays open.
    refetchInterval: (query) => {
      if (hasWaitedTooLong) return false;

      const rows = query.state.data?.rows;
      return hasSchedule && rows && rows.length === 0 ? PENDING_POLL_MS : false;
    },
  });

  const hasRows = (data?.rows.length ?? 0) > 0;
  // A failed request is not "still generating": with nothing cached, an error
  // leaves `data` undefined and `isLoading` false, which would otherwise read
  // as pending and then as stuck.
  const isWaiting = hasSchedule && !hasRows && !isLoading && !isError;

  // Timed rather than counted from `refetchInterval`: that callback runs
  // during render, where a state update is not allowed.
  //
  // `hasWaitedTooLong` is a dependency so that clearing it — which Regenerate
  // does — actually re-arms the timer. Without it the effect would not re-run
  // while `isWaiting` stayed true, and polling would resume with nothing left
  // to ever stop it.
  useEffect(() => {
    if (!isWaiting) {
      setHasWaitedTooLong(false);
      return;
    }

    if (hasWaitedTooLong) return;

    const timer = setTimeout(
      () => setHasWaitedTooLong(true),
      PENDING_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [isWaiting, hasWaitedTooLong]);

  const regenerateMut = useMutation(
    trpc.groups.regenerateSessions.mutationOptions(),
  );

  async function handleRegenerate() {
    try {
      const result = await regenerateMut.mutateAsync({ id: groupId });
      // Zero written with a schedule set means the slots expand to nothing —
      // every occurrence already in the past, or slots the expander rejects.
      // Reporting success would send the user back to a still-empty list.
      const wroteRows = result.written > 0;
      toast.success(
        t(
          wroteRows
            ? "groups.sessions.regenerated"
            : "groups.sessions.regeneratedEmpty",
        ),
      );
      // Only a run that produced something justifies waiting again. Resetting
      // unconditionally would put the "generating…" spinner back for another
      // 30 seconds, contradicting the toast that just said there was nothing
      // to generate.
      if (wroteRows) setHasWaitedTooLong(false);
      await queryClient.invalidateQueries({
        queryKey: trpc.sessions.pathKey(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("groups.sessions.regenerateFailed"),
      );
    }
  }

  // An empty list means three different things. Telling someone who just saved
  // a schedule to "add a slot" reads as though their save was lost, and
  // telling someone whose generation never ran that it is still working reads
  // as though waiting will fix it.
  const emptyState = () => {
    if (isWaiting && !hasWaitedTooLong) {
      return (
        <EmptyState
          icon={<Spinner />}
          title={t("groups.sessions.pending")}
          description={t("groups.sessions.lead")}
        />
      );
    }

    if (isWaiting) {
      return (
        <EmptyState
          icon={<CalendarDaysIcon />}
          title={t("groups.sessions.stuckTitle")}
          description={t("groups.sessions.stuckDescription")}
        />
      );
    }

    return (
      <EmptyState
        icon={<CalendarDaysIcon />}
        title={t("groups.sessions.emptyTitle")}
        description={t("groups.sessions.emptyDescription")}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("groups.sessions.title")}</CardTitle>
        <CardDescription>{t("groups.sessions.lead")}</CardDescription>
        {hasSchedule ? (
          <CardAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={regenerateMut.isPending}
              onClick={() => void handleRegenerate()}
            >
              <RefreshCwIcon className="size-3.5" />
              {t("groups.sessions.regenerate")}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          // Said plainly rather than folded into the empty state: the sessions
          // may well exist and simply not have been readable this time.
          <EmptyState
            icon={<CalendarDaysIcon />}
            title={t("groups.sessions.loadFailedTitle")}
            description={t("groups.sessions.loadFailedDescription")}
          />
        ) : hasRows ? (
          <SessionList
            sessions={data?.rows ?? []}
            hasActiveMeetingAccount={data?.hasActiveMeetingAccount ?? false}
            timeZone={timeZone}
            canOpenRegister={canOpenRegister}
          />
        ) : (
          emptyState()
        )}
      </CardContent>
    </Card>
  );
}
