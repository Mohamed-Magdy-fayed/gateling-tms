import { Tag } from "@/components/ui/tag";
import { getT } from "@/features/core/i18n/server";

export async function PricingHeroSection() {
  const { t } = await getT();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 start-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-500/10" />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <Tag color="orange">{t("pricing.hero.badge")}</Tag>
        <h1 className="mt-5 text-balance font-display text-4xl font-bold text-foreground sm:text-5xl">
          {t("pricing.hero.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
          {t("pricing.hero.description")}
        </p>
      </div>
    </section>
  );
}
