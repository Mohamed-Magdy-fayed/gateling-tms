import { getT } from "@/features/core/i18n/server";

export async function AboutHeroSection() {
  const { t } = await getT();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 end-0 size-[28rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-500/10" />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-balance font-display text-4xl font-bold text-foreground sm:text-5xl">
          {t("about.hero.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
          {t("about.hero.description")}
        </p>
      </div>
    </section>
  );
}
