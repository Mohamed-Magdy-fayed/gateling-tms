import {
  BarChart3Icon,
  CheckIcon,
  type LucideIcon,
  ShieldIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import {
  type OrganizationPlan,
  organizationPlanValues,
} from "@/drizzle/schema";
import { getT } from "@/features/core/i18n/server";
import { PLAN_LIMITS } from "@/features/core/organizations/server/limits";
import {
  featureModuleKeys,
  PLAN_MONTHLY_PRICE_EGP,
  POPULAR_PLAN,
  planIncludesModule,
} from "@/features/marketing/nextjs/pricing/data";
import { cn } from "@/lib/utils";

const BYTES_PER_GB = 1024 * 1024 * 1024;

const PLAN_ICONS: Record<OrganizationPlan, LucideIcon> = {
  free: ZapIcon,
  basic: UsersIcon,
  professional: BarChart3Icon,
  enterprise: ShieldIcon,
};

export async function PricingPlansSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {organizationPlanValues.map((plan) => {
          const Icon = PLAN_ICONS[plan];
          const isFree = plan === "free";
          const isPopular = plan === POPULAR_PLAN;
          const price = PLAN_MONTHLY_PRICE_EGP[plan];
          const limits = PLAN_LIMITS[plan];

          return (
            <Card
              key={plan}
              className={cn(
                "h-full",
                isPopular &&
                  "shadow-[var(--shadow-brand)] ring-1 ring-primary/40",
              )}
            >
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                {isPopular ? (
                  <CardAction>
                    <Tag color="orange">{t("pricing.mostPopular")}</Tag>
                  </CardAction>
                ) : null}
                <h3 className="mt-1 font-display font-semibold text-foreground text-lg">
                  {t(`pricing.plans.${plan}.name`)}
                </h3>
                <CardDescription>
                  {t(`pricing.plans.${plan}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-foreground">
                    {price === 0
                      ? t("pricing.free")
                      : `${price} ${t("pricing.currency")}`}
                  </span>
                  {price > 0 ? (
                    <span className="text-muted-foreground text-sm">
                      {t("pricing.perMonth")}
                    </span>
                  ) : null}
                </div>

                <ul className="space-y-1.5">
                  {featureModuleKeys.map((moduleKey) => {
                    const included = planIncludesModule(plan, moduleKey);
                    return (
                      <li
                        key={moduleKey}
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          included
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {included ? (
                          <CheckIcon className="size-4 shrink-0 text-primary" />
                        ) : (
                          <XIcon className="size-4 shrink-0 text-muted-foreground/50" />
                        )}
                        {t(`pricing.featureLabels.${moduleKey}`)}
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-1 border-t pt-4 text-muted-foreground text-xs">
                  <div className="flex justify-between">
                    <span>{t("pricing.limits.students")}</span>
                    <span>
                      {limits.maxStudents === null
                        ? t("pricing.limits.unlimited")
                        : limits.maxStudents.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("pricing.limits.courses")}</span>
                    <span>
                      {limits.maxCourses === null
                        ? t("pricing.limits.unlimited")
                        : limits.maxCourses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("pricing.limits.storage")}</span>
                    <span>
                      {Math.round(limits.maxStorageBytes / BYTES_PER_GB)} GB
                    </span>
                  </div>
                </div>

                {isFree ? (
                  <Button
                    className="w-full"
                    render={<Link href="/get-started" />}
                  >
                    {t("pricing.signupCta")}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {t("pricing.comingSoon")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
