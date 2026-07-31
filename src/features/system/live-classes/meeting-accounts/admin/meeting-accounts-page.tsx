"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, PlugZapIcon, VideoIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/ui/tag";
import { H2, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { MeetingAccountListRow } from "@/features/system/live-classes/meeting-accounts/server";
import { useTRPC } from "@/integrations/trpc/client";
import {
  MeetingAccountConnectDialog,
  MeetingAccountDisconnectDialog,
} from "./components";

const LIST_INPUT = { page: 1, perPage: 50, sorting: [] };

/**
 * An integration settings surface, not an entity list: an org connects one
 * onMeeting account and gets a handful of rooms, so cards read better than the
 * paginated data table every domain entity uses (STATE.md D96, carried over
 * from the Zoom version of this page).
 *
 * There is no per-card "reconnect" action, unlike Zoom's: without an OAuth
 * round trip there is nothing to resume — a room whose credentials stopped
 * working is disconnected and connected again.
 */
export function MeetingAccountsPage() {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const [connectOpen, setConnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const configuredQuery = useQuery(
    trpc.meetingAccounts.isConfigured.queryOptions(),
  );
  const listQuery = useQuery(
    trpc.meetingAccounts.list.queryOptions(LIST_INPUT),
  );

  const isConfigured = configuredQuery.data?.configured ?? true;
  const meetingAccounts = listQuery.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <H2>{t("meetingAccounts.title")}</H2>
          <Muted>{t("meetingAccounts.subtitle")}</Muted>
        </div>
        <Button onClick={() => setConnectOpen(true)} disabled={!isConfigured}>
          <PlugZapIcon className="size-4" />
          {t("meetingAccounts.connect")}
        </Button>
      </div>

      {!isConfigured && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertDescription>
            {t("meetingAccounts.errors.notConfigured")}
          </AlertDescription>
        </Alert>
      )}

      {listQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{t("meetingAccounts.loadFailed")}</AlertDescription>
        </Alert>
      )}

      {listQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : listQuery.isError ? null : meetingAccounts.length === 0 ? (
        // A failed load leaves `rows` empty, which is not the same fact as
        // "this org has connected nothing" — showing both messages would have
        // the page contradict itself about something the admin can't check.
        <Card>
          <CardContent>
            <EmptyState
              icon={<VideoIcon />}
              title={t("meetingAccounts.emptyTitle")}
              description={t("meetingAccounts.emptyDescription")}
              action={
                <Button
                  onClick={() => setConnectOpen(true)}
                  disabled={!isConfigured}
                >
                  <PlugZapIcon className="size-4" />
                  {t("meetingAccounts.connect")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {meetingAccounts.map((meetingAccount) => (
            <MeetingAccountCard
              key={meetingAccount.id}
              meetingAccount={meetingAccount}
              onDisconnect={() =>
                setDisconnecting({
                  id: meetingAccount.id,
                  name: meetingAccount.name,
                })
              }
            />
          ))}
        </div>
      )}

      <MeetingAccountConnectDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
      />
      <MeetingAccountDisconnectDialog
        open={disconnecting !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnecting(null);
        }}
        meetingAccount={disconnecting}
      />
    </div>
  );
}

const STATUS_TAG_COLOR = {
  active: "green",
  error: "neutral",
} as const;

function MeetingAccountCard({
  meetingAccount,
  onDisconnect,
}: {
  meetingAccount: MeetingAccountListRow;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meetingAccount.name}</CardTitle>
        <CardDescription>
          {t("meetingAccounts.roomLabel", { room: meetingAccount.roomName })}
        </CardDescription>
        <CardAction>
          <Tag color={STATUS_TAG_COLOR[meetingAccount.status]}>
            {t(`meetingAccounts.status.${meetingAccount.status}`)}
          </Tag>
        </CardAction>
      </CardHeader>

      {meetingAccount.status === "error" && meetingAccount.lastError && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>{meetingAccount.lastError}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <CardFooter>
        <Button variant="ghost" onClick={onDisconnect}>
          {t("meetingAccounts.disconnect")}
        </Button>
      </CardFooter>
    </Card>
  );
}
