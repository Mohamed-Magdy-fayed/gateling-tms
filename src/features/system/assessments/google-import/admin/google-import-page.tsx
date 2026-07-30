"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import {
  GOOGLE_CONNECT_RESULT_PARAM,
  parseGoogleConnectResultCode,
} from "@/features/system/assessments/google-import/lib/redirect-codes";
import { useTRPC } from "@/integrations/trpc/client";
import {
  GoogleConnectionCard,
  GoogleDisconnectDialog,
  GoogleImportPanel,
} from "./components";

/**
 * The organization's Google connection and the form import that uses it.
 * Reached from the Assessments page rather than the sidebar: it belongs to
 * building assessments, not to a section of its own.
 */
export function GoogleImportPage() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const searchParams = useSearchParams();

  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const resultCode = parseGoogleConnectResultCode(
    searchParams.get(GOOGLE_CONNECT_RESULT_PARAM),
  );

  const configuredQuery = useQuery(
    trpc.googleImport.isConfigured.queryOptions(),
  );
  const integrationQuery = useQuery(trpc.googleImport.get.queryOptions());
  const organizationQuery = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  // Optimistic default: assume configured until the check says otherwise, so
  // the page doesn't flash a "not configured" warning while loading.
  const isConfigured = configuredQuery.data?.configured ?? true;
  const canManage = organizationQuery.data?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <H2>{t("googleImport.title")}</H2>
        <Muted>{t("googleImport.subtitle")}</Muted>
      </div>

      {resultCode && (
        <Alert variant={resultCode === "connected" ? "success" : "destructive"}>
          {resultCode === "connected" ? (
            <CheckCircle2Icon />
          ) : (
            <AlertTriangleIcon />
          )}
          <AlertDescription>
            {t(`googleImport.result.${resultCode}`)}
          </AlertDescription>
        </Alert>
      )}

      {!isConfigured && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          <AlertDescription>
            {t("googleImport.errors.notConfigured")}
          </AlertDescription>
        </Alert>
      )}

      {integrationQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>{t("googleImport.loadFailed")}</AlertDescription>
        </Alert>
      )}

      {integrationQuery.isPending ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <>
          {/* A teacher can import, but binding an external account to the
              whole org is the admin's call — the server enforces this too. */}
          {!canManage && (
            <Alert>
              <AlertDescription>{t("googleImport.adminOnly")}</AlertDescription>
            </Alert>
          )}
          <GoogleConnectionCard
            canManage={canManage}
            integration={integrationQuery.data ?? null}
            isConfigured={isConfigured}
            onDisconnect={() => setDisconnectOpen(true)}
          />
          {/* Importing needs a working connection — an errored one can't read
              a form, so the panel stays out of the way until it's fixed. */}
          {integrationQuery.data?.status === "active" && <GoogleImportPanel />}
        </>
      )}

      <GoogleDisconnectDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
      />
    </div>
  );
}
