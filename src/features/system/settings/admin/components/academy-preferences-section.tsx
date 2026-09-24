"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  type LucideIcon,
  RotateCwIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { listAcademySettingDefinitions } from "../../lib/academy-settings";
import type { AcademySettingGroup } from "../../lib/academy-settings-registry";
import type { AcademySettingRow } from "../../server";
import { AcademyPreferenceRow } from "./academy-preference-row";

/** Card order on the page, and each group's inline icon (design 8B). */
const GROUPS: readonly { group: AcademySettingGroup; icon: LucideIcon }[] = [
  { group: "scheduling", icon: CalendarClockIcon },
  { group: "attendance", icon: ClipboardCheckIcon },
];

/**
 * "Academy preferences" on the academy's Settings page (design 1A): one card
 * per group, each preference drawn from its declared control. Admins only —
 * the caller renders it behind `canManage`, and `settings.academy.*` is
 * `orgAdminProcedure` regardless.
 *
 * With nothing registered there is nothing to say, so the section renders
 * nothing at all and doesn't query (design 4A: no empty card).
 */
export function AcademyPreferencesSection() {
  const registered = listAcademySettingDefinitions().length;
  if (registered === 0) return null;
  return <AcademyPreferences registered={registered} />;
}

function AcademyPreferences({ registered }: { registered: number }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const listQuery = useQuery(trpc.settings.academy.list.queryOptions());

  return (
    <section aria-labelledby="academy-preferences" className="space-y-3">
      <div className="space-y-1">
        <H3 id="academy-preferences" className="text-lg">
          {t("academySettings.title")}
        </H3>
        <Muted>{t("academySettings.description")}</Muted>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {t("academySettings.loadFailed")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void listQuery.refetch()}
            >
              <RotateCwIcon className="size-3.5" />
              {t("academySettings.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : !listQuery.data ? (
        <Card>
          <CardContent className="space-y-4">
            {Array.from({ length: registered }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        GROUPS.map(({ group, icon }) => (
          <GroupCard
            key={group}
            group={group}
            icon={icon}
            rows={listQuery.data.filter((row) => row.group === group)}
          />
        ))
      )}
    </section>
  );
}

function GroupCard({
  group,
  icon: Icon,
  rows,
}: {
  group: AcademySettingGroup;
  icon: LucideIcon;
  rows: AcademySettingRow[];
}) {
  const { t } = useTranslation();
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden className="size-4" />
          {t(`academySettings.groups.${group}.title`)}
        </CardTitle>
        <CardDescription>
          {t(`academySettings.groups.${group}.description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {rows.map((row) => (
          <AcademyPreferenceRow key={row.code} setting={row} />
        ))}
      </CardContent>
    </Card>
  );
}
