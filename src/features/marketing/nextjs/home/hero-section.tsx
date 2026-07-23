import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT } from "@/features/core/i18n/server";

export async function HeroSection() {
  const { t } = await getT();

  const highlights = [
    t("landing.hero.highlights.free"),
    t("landing.hero.highlights.noCard"),
    t("landing.hero.highlights.bilingual"),
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 end-0 size-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 start-0 size-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h1 className="text-balance font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          {t("landing.hero.subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/get-started" />}>
            {t("landing.hero.primaryCta")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/auth/sign-in" />}
          >
            {t("landing.hero.secondaryCta")}
          </Button>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-center gap-1.5">
              <CheckIcon className="size-4 text-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
