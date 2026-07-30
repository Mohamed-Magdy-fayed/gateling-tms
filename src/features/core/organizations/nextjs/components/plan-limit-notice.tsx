"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { usageSeverity } from "../../lib/plan-usage";

type LimitedResource = "students" | "courses";

/**
 * The one place a plan limit is announced before it is hit (phase-08.md step
 * 1's "friendly limit UI everywhere"). Rendered above the entity lists, it
 * stays invisible until usage is near the cap, so an organization nowhere
 * near its limit never sees an upsell.
 *
 * No upgrade button — paid plans don't exist yet (README rule 9), so the
 * notice points at the pricing page and says so plainly.
 */
export function PlanLimitNotice({ resource }: { resource: LimitedResource }) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data } = useQuery(trpc.organizations.usage.queryOptions());

  if (!data) return null;

  const used = data.usage[resource];
  const limit = data.limits[resource];
  const severity = usageSeverity(used, limit);

  // `limit === null` is already "ok", but narrowing it here keeps the message
  // lookup below free of a null it can never render.
  if (limit === null || severity === "ok") return null;

  const isReached = severity === "reached";
  const message =
    resource === "students"
      ? isReached
        ? t("organizations.usage.studentsReached", { limit })
        : t("organizations.usage.studentsApproaching", { used, limit })
      : isReached
        ? t("organizations.usage.coursesReached", { limit })
        : t("organizations.usage.coursesApproaching", { used, limit });

  return (
    <Alert variant={isReached ? "warning" : "info"}>
      {isReached ? <TriangleAlertIcon /> : <InfoIcon />}
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription>
        {isReached ? `${t("organizations.usage.reachedHint")} ` : ""}
        {t("organizations.usage.comingSoon")}{" "}
        <Link href="/pricing">{t("organizations.usage.seePlans")}</Link>
      </AlertDescription>
    </Alert>
  );
}
