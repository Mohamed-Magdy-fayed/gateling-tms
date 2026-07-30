"use client";

import {
  AlertTriangleIcon,
  FileSpreadsheetIcon,
  RefreshCwIcon,
} from "lucide-react";
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
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import type { GoogleIntegrationRow } from "@/features/system/assessments/google-import/server";

const STATUS_TAG_COLOR = {
  active: "green",
  error: "neutral",
} as const;

type GoogleConnectionCardProps = {
  canManage: boolean;
  integration: GoogleIntegrationRow | null;
  isConfigured: boolean;
  onDisconnect: () => void;
};

/**
 * An integration settings surface rather than an entity list — an org has
 * exactly one Google grant, so one card carries the whole state: which account
 * is connected, whether it still works, and the two actions on it (same
 * reasoning as the Zoom connections page, STATE.md D96).
 */
export function GoogleConnectionCard({
  canManage,
  integration,
  isConfigured,
  onDisconnect,
}: GoogleConnectionCardProps) {
  const { t, locale } = useTranslation();

  if (!integration) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<FileSpreadsheetIcon />}
            title={t("googleImport.notConnectedTitle")}
            description={t("googleImport.notConnectedDescription")}
            action={<ConnectLink disabled={!isConfigured || !canManage} />}
          />
        </CardContent>
      </Card>
    );
  }

  const connectedOn = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  }).format(new Date(integration.createdAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("googleImport.connectTitle")}</CardTitle>
        <CardDescription>
          {integration.googleEmail
            ? t("googleImport.connectedAs", { email: integration.googleEmail })
            : t("googleImport.connectedOn", { date: connectedOn })}
        </CardDescription>
        <CardAction>
          <Tag color={STATUS_TAG_COLOR[integration.status]}>
            {t(`googleImport.status.${integration.status}`)}
          </Tag>
        </CardAction>
      </CardHeader>

      {integration.status === "error" && integration.lastError && (
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>{integration.lastError}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      <CardFooter className="gap-2">
        <ConnectLink
          disabled={!isConfigured || !canManage}
          label={t("googleImport.reconnect")}
          variant="outline"
        />
        <Button variant="ghost" onClick={onDisconnect} disabled={!canManage}>
          {t("googleImport.disconnect")}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ConnectLink({
  disabled,
  label,
  variant = "default",
}: {
  disabled: boolean;
  label?: string;
  variant?: "default" | "outline";
}) {
  const { t } = useTranslation();
  const text = label ?? t("googleImport.connect");

  if (disabled) {
    return (
      <Button variant={variant} disabled>
        <RefreshCwIcon className="size-3.5" />
        {text}
      </Button>
    );
  }

  // A plain anchor, not next/link: the connect route sets the state cookie and
  // redirects off-site to Google, so it needs a full navigation rather than a
  // client-side route change.
  return (
    <a href="/api/google/connect" className={buttonVariants({ variant })}>
      <RefreshCwIcon className="size-3.5" />
      {text}
    </a>
  );
}
