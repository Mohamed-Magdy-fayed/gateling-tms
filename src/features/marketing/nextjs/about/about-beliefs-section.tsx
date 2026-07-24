import {
  BadgeCheckIcon,
  FileSpreadsheetIcon,
  LanguagesIcon,
  type LucideIcon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/features/core/i18n/server";
import { cn } from "@/lib/utils";

const items: Array<{
  key:
    | "instantOnboarding"
    | "excelFirst"
    | "freeForever"
    | "bilingual"
    | "truthful";
  icon: LucideIcon;
  tone: "orange" | "blue" | "green" | "violet" | "neutral";
}> = [
  { key: "instantOnboarding", icon: RocketIcon, tone: "orange" },
  { key: "excelFirst", icon: FileSpreadsheetIcon, tone: "blue" },
  { key: "freeForever", icon: ShieldCheckIcon, tone: "green" },
  { key: "bilingual", icon: LanguagesIcon, tone: "violet" },
  { key: "truthful", icon: BadgeCheckIcon, tone: "neutral" },
];

const toneClasses = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/40",
  blue: "bg-sky-50 text-sky-600 dark:bg-sky-950/40",
  green: "bg-mint-50 text-mint-600 dark:bg-mint-950/40",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40",
  neutral: "bg-muted text-muted-foreground",
} as const;

export async function AboutBeliefsSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display font-bold text-3xl text-foreground">
          {t("about.beliefs.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("about.beliefs.description")}
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, icon: Icon, tone }) => (
          <Card
            key={key}
            className="transition-transform duration-300 ease-out-soft hover:-translate-y-1"
          >
            <CardContent className="space-y-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  toneClasses[tone],
                )}
              >
                <Icon className="size-5" />
              </span>
              <h3 className="font-display font-semibold text-foreground">
                {t(`about.beliefs.items.${key}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t(`about.beliefs.items.${key}.description`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
