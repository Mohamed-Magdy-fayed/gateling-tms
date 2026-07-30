"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { toStorageDisplay, usagePercent } from "../../lib/plan-usage";

/**
 * Plan card + usage meters for the organization settings page (phase-08.md
 * step 2). Deliberately has no upgrade button: nothing is purchasable yet, and
 * a button that can't do anything is exactly the dead end README rule 9 bans.
 */
export function PlanUsageCard() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data } = useQuery(trpc.organizations.usage.queryOptions());

  if (!data) return null;

  function formatStorage(bytes: number): string {
    const { amount, unit } = toStorageDisplay(bytes);

    return unit === "gb"
      ? t("organizations.usage.gigabytes", { amount })
      : t("organizations.usage.megabytes", { amount });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t("organizations.usage.title")}
        </CardTitle>
        <CardDescription>
          {t("organizations.usage.description")}
        </CardDescription>
        <CardAction>
          <Tag color="violet">{t(`organizations.plan.${data.plan}`)}</Tag>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanUsageRow
          label={t("organizations.usage.students")}
          detail={
            data.limits.students === null
              ? t("organizations.usage.countUnlimited", {
                  used: data.usage.students,
                })
              : t("organizations.usage.countOf", {
                  used: data.usage.students,
                  limit: data.limits.students,
                })
          }
          percent={usagePercent(data.usage.students, data.limits.students)}
        />
        <PlanUsageRow
          label={t("organizations.usage.courses")}
          detail={
            data.limits.courses === null
              ? t("organizations.usage.countUnlimited", {
                  used: data.usage.courses,
                })
              : t("organizations.usage.countOf", {
                  used: data.usage.courses,
                  limit: data.limits.courses,
                })
          }
          percent={usagePercent(data.usage.courses, data.limits.courses)}
        />
        <PlanUsageRow
          label={t("organizations.usage.storage")}
          detail={t("organizations.usage.storageOf", {
            used: formatStorage(data.usage.storageBytes),
            limit: formatStorage(data.limits.storageBytes),
          })}
          percent={usagePercent(
            data.usage.storageBytes,
            data.limits.storageBytes,
          )}
        />

        <p className="text-muted-foreground text-xs">
          {t("organizations.usage.comingSoon")}{" "}
          <Link
            href="/pricing"
            className="underline underline-offset-4 hover:text-foreground"
          >
            {t("organizations.usage.seePlans")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * A capped counter gets a bar; an uncapped one gets the count alone. Drawing
 * a bar for an unlimited allowance would invent a ceiling that doesn't exist.
 */
function PlanUsageRow({
  label,
  detail,
  percent,
}: {
  label: string;
  detail: string;
  percent: number | null;
}) {
  if (percent !== null) {
    return <ProgressMeter label={label} detail={detail} percent={percent} />;
  }

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-medium text-sm">{label}</span>
      <span className="text-muted-foreground text-xs">{detail}</span>
    </div>
  );
}
