import {
  FileSpreadsheetIcon,
  LanguagesIcon,
  type LucideIcon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { getT } from "@/features/core/i18n/server";
import { cn } from "@/lib/utils";

const items: Array<{
  key: "instantOnboarding" | "excelFirst" | "freeForever" | "bilingual";
  icon: LucideIcon;
  tone: "orange" | "blue" | "green" | "violet";
}> = [
  { key: "instantOnboarding", icon: RocketIcon, tone: "orange" },
  { key: "excelFirst", icon: FileSpreadsheetIcon, tone: "blue" },
  { key: "freeForever", icon: ShieldCheckIcon, tone: "green" },
  { key: "bilingual", icon: LanguagesIcon, tone: "violet" },
];

const toneClasses = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/40",
  blue: "bg-sky-50 text-sky-600 dark:bg-sky-950/40",
  green: "bg-mint-50 text-mint-600 dark:bg-mint-950/40",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40",
} as const;

export async function ValuePropositionSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ key, icon: Icon, tone }) => (
          <div key={key} className="space-y-3 rounded-lg border bg-card p-5">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                toneClasses[tone],
              )}
            >
              <Icon className="size-5" />
            </span>
            <h3 className="font-display font-semibold text-foreground">
              {t(`landing.valueProposition.${key}.title`)}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t(`landing.valueProposition.${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
