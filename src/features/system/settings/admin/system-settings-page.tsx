"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  PlugZapIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, H3, InlineCode, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";
import type { SystemSettingRow } from "@/features/system/settings/server";
import { useTRPC } from "@/integrations/trpc/client";
import { SettingValueForm } from "./components/setting-value-form";

/**
 * The platform owner's page ("Platform"): deployment-wide integrations, as
 * one card per system the app talks to. Only the platform owner
 * (`users.isPlatformOwner`) sees the cards; everyone else gets a calm empty
 * state, since there is nothing here for them to do.
 *
 * The same flow as every other Gateling system: create the integration on
 * the provider's side, then paste what it hands back in here. The card
 * therefore shows the two values the admin has to *give* Meetings (this
 * deployment's webhook URL and origin) right above the fields for the two
 * values they *get* from it, so the whole setup reads top to bottom on one
 * screen.
 */
export function SystemSettingsPage({
  isPlatformOwner,
}: {
  // Display gate only — settings.list/update re-check the flag server-side.
  isPlatformOwner: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <H2>{t("settings.title")}</H2>
        <Muted>{t("settings.subtitle")}</Muted>
      </div>

      {isPlatformOwner ? (
        <IntegrationsSection />
      ) : (
        <EmptyState
          icon={<ShieldAlertIcon />}
          title={t("settings.title")}
          description={t("settings.ownerOnly")}
        />
      )}
    </div>
  );
}

function IntegrationsSection() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const settingsQuery = useQuery(trpc.settings.list.queryOptions());

  return (
    <section aria-labelledby="platform-integrations" className="space-y-3">
      <H3 id="platform-integrations" className="text-lg">
        {t("settings.integrationsTitle")}
      </H3>
      {settingsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{t("settings.loadFailed")}</AlertDescription>
        </Alert>
      ) : !settingsQuery.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <MeetingsCard settings={settingsQuery.data} />
      )}
    </section>
  );
}

function MeetingsCard({ settings }: { settings: SystemSettingRow[] }) {
  const { t } = useTranslation();
  const rows = settings.filter((setting) => setting.group === "meetings");
  const byCode = new Map(rows.map((row) => [row.code, row]));

  const hasKey = byCode.get(SYSTEM_SETTING_CODE.MEETINGS_API_KEY)?.hasValue;
  const hasSecret = byCode.get(
    SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
  )?.hasValue;

  // What this deployment is, as the browser sees it — the values Meetings'
  // integration form asks for. Read from the page rather than configured:
  // the origin the admin is looking at is the origin students will return to.
  // Through useSyncExternalStore so the server render (no window) and the
  // first client render agree, instead of a hydration mismatch.
  const origin = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => "",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZapIcon className="size-4" />
          {t("settings.groups.meetings.title")}
        </CardTitle>
        <CardDescription>
          {t("settings.groups.meetings.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasKey && hasSecret ? (
          <Alert variant="success">
            <CheckCircle2Icon />
            <AlertDescription>
              {t("settings.groups.meetings.status.configured")}
            </AlertDescription>
          </Alert>
        ) : hasKey ? (
          <Alert variant="warning">
            <AlertTriangleIcon />
            <AlertDescription>
              {t("settings.groups.meetings.status.missingSecret")}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription>
              {t("settings.groups.meetings.status.missingKey")}
            </AlertDescription>
          </Alert>
        )}

        <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:items-center">
          <dt className="text-muted-foreground">
            {t("settings.groups.meetings.webhookUrl")}
          </dt>
          <dd>
            <InlineCode dir="ltr">{`${origin}/api/meetings-webhook`}</InlineCode>
          </dd>
          <dt className="text-muted-foreground">
            {t("settings.groups.meetings.returnOrigin")}
          </dt>
          <dd>
            <InlineCode dir="ltr">{origin}</InlineCode>
          </dd>
        </dl>

        <Separator />

        <div className="space-y-8">
          {rows.map((setting) => (
            <SettingValueForm key={setting.code} setting={setting} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function subscribeToNothing() {
  return () => {};
}
