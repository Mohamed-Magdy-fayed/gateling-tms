"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

export function DashboardOverview() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {organization
              ? t("dashboard.welcome.title", { orgName: organization.name })
              : t("dashboard.welcome.titleFallback")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.welcome.subtitle")}
          </p>
        </div>
        {organization && (
          <Tag color="violet">
            {t(`organizations.plan.${organization.plan}`)}
          </Tag>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("dashboard.stats.students")}
          value={organization?.studentCount ?? 0}
          icon={<UsersIcon />}
          tone="blue"
        />
        <StatCard
          label={t("dashboard.stats.courses")}
          value={organization?.courseCount ?? 0}
          icon={<BookOpenIcon />}
          tone="green"
        />
        <StatCard
          label={t("dashboard.stats.plan")}
          value={
            organization ? t(`organizations.plan.${organization.plan}`) : "—"
          }
          icon={<SparklesIcon />}
          tone="brand"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={<SparklesIcon />}
          title={t("dashboard.upcoming.title")}
          description={t("dashboard.upcoming.description")}
          action={
            <Button variant="outline" render={<Link href="/organizations" />}>
              {t("dashboard.upcoming.settingsCta")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
