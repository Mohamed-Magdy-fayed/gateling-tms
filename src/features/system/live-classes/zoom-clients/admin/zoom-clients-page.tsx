"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  PlugZapIcon,
  RefreshCwIcon,
  VideoIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  parseZoomConnectResultCode,
  ZOOM_CONNECT_RESULT_PARAM,
} from "@/features/system/live-classes/zoom-clients/lib/redirect-codes";
import type { ZoomClientListRow } from "@/features/system/live-classes/zoom-clients/server";
import { useTRPC } from "@/integrations/trpc/client";
import {
  ZoomClientCreateDialog,
  ZoomClientDisconnectDialog,
} from "./components";

const LIST_INPUT = { page: 1, perPage: 50, sorting: [] };

/**
 * An integration settings surface, not an entity list: an org connects one or
 * two Zoom accounts, so cards read better than the paginated data table every
 * domain entity uses (STATE.md D96). Statuses, the reason a connection
 * failed, and the two actions per account are all visible without a row menu.
 */
export function ZoomClientsPage() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const searchParams = useSearchParams();

  const [createOpen, setCreateOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const resultCode = parseZoomConnectResultCode(
    searchParams.get(ZOOM_CONNECT_RESULT_PARAM),
  );

  const configuredQuery = useQuery(
    trpc.zoomClients.isConfigured.queryOptions(),
  );
  const listQuery = useQuery(trpc.zoomClients.list.queryOptions(LIST_INPUT));

  const isConfigured = configuredQuery.data?.configured ?? true;
  const zoomClients = listQuery.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <H2>{t("zoomClients.title")}</H2>
          <Muted>{t("zoomClients.subtitle")}</Muted>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!isConfigured}>
          <PlugZapIcon className="size-4" />
          {t("zoomClients.connect")}
        </Button>
      </div>

      {resultCode && (
        <Alert variant={resultCode === "connected" ? "success" : "destructive"}>
          {resultCode === "connected" ? (
            <CheckCircle2Icon />
          ) : (
            <AlertTriangleIcon />
          )}
          <AlertDescription>
            {t(`zoomClients.result.${resultCode}`)}
          </AlertDescription>
        </Alert>
      )}

      {!isConfigured && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertDescription>
            {t("zoomClients.errors.notConfigured")}
          </AlertDescription>
        </Alert>
      )}

      {listQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{t("zoomClients.loadFailed")}</AlertDescription>
        </Alert>
      )}

      {listQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : zoomClients.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<VideoIcon />}
              title={t("zoomClients.emptyTitle")}
              description={t("zoomClients.emptyDescription")}
              action={
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={!isConfigured}
                >
                  <PlugZapIcon className="size-4" />
                  {t("zoomClients.connect")}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {zoomClients.map((zoomClient) => (
            <ZoomClientCard
              key={zoomClient.id}
              zoomClient={zoomClient}
              onDisconnect={() =>
                setDisconnecting({
                  id: zoomClient.id,
                  name: zoomClient.name,
                })
              }
            />
          ))}
        </div>
      )}

      <ZoomClientCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ZoomClientDisconnectDialog
        open={disconnecting !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnecting(null);
        }}
        zoomClient={disconnecting}
      />
    </div>
  );
}

const STATUS_TAG_COLOR = {
  active: "green",
  pending: "orange",
  error: "neutral",
} as const;

function ZoomClientCard({
  onDisconnect,
  zoomClient,
}: {
  onDisconnect: () => void;
  zoomClient: ZoomClientListRow;
}) {
  const { t } = useTranslation();
  const isConnected = zoomClient.status === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{zoomClient.name}</CardTitle>
        <CardDescription>
          {zoomClient.zoomEmail ?? t("zoomClients.notLinkedYet")}
        </CardDescription>
        <CardAction>
          <Tag color={STATUS_TAG_COLOR[zoomClient.status]}>
            {t(`zoomClients.status.${zoomClient.status}`)}
          </Tag>
        </CardAction>
      </CardHeader>

      {zoomClient.status === "error" && zoomClient.lastError && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>{zoomClient.lastError}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <CardFooter className="gap-2">
        {/* A plain anchor, not next/link: the connect route sets the state
            cookie and redirects off-site to Zoom, so it needs a full
            navigation rather than a client-side route change. */}
        <a
          href={`/api/zoom/connect/${zoomClient.id}`}
          className={buttonVariants({
            variant: isConnected ? "outline" : "default",
          })}
        >
          <RefreshCwIcon className="size-3.5" />
          {isConnected
            ? t("zoomClients.reconnect")
            : t("zoomClients.finishConnecting")}
        </a>
        <Button variant="ghost" onClick={onDisconnect}>
          {t("zoomClients.disconnect")}
        </Button>
      </CardFooter>
    </Card>
  );
}
