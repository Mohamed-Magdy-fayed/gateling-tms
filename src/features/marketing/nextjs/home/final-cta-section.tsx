import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT } from "@/features/core/i18n/server";

export async function FinalCtaSection() {
  const { t } = await getT();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 start-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/60 blur-3xl dark:bg-orange-500/5"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display font-bold text-3xl text-foreground sm:text-4xl">
          {t("landing.finalCta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {t("landing.finalCta.subtitle")}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" render={<Link href="/get-started" />}>
            {t("landing.finalCta.cta")}
          </Button>
        </div>
        <p className="mt-4 text-muted-foreground text-xs">
          {t("landing.hero.highlights.noCard")} ·{" "}
          {t("landing.hero.highlights.free")}
        </p>
      </div>
    </section>
  );
}
