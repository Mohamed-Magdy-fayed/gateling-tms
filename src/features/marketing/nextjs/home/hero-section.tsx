import { BookOpenIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/ui/course-card";
import { Tag } from "@/components/ui/tag";
import { getT } from "@/features/core/i18n/server";

// TODO(launch): heroSocialProofPeople and the academy count below are
// placeholder social proof (no real customers pre-launch) — swap for a real
// customer sample and figure once they exist. Tracked in docs/rebuild/STATE.md.
const heroSocialProofPeople = [
  { name: "Ada L" },
  { name: "Sam R" },
  { name: "Kofi M" },
  { name: "Mei X" },
  { name: "Jo P" },
];

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
        <div className="absolute top-0 end-0 size-[28rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-200/50 blur-3xl dark:bg-orange-500/10" />
        <div className="absolute bottom-0 start-0 size-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
        <div className="text-center lg:text-start">
          <Tag color="orange">{t("landing.hero.highlights.free")}</Tag>
          <h1 className="mt-5 text-balance font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground lg:mx-0">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm lg:justify-start">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-primary" />
                {highlight}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-center gap-3 border-border/60 border-t pt-8 lg:justify-start">
            <AvatarGroup items={heroSocialProofPeople} />
            <p className="text-muted-foreground text-sm">
              <span className="font-display font-bold text-foreground">
                {t("landing.hero.socialProof.count")}
              </span>{" "}
              {t("landing.hero.socialProof.suffix")}{" "}
              <span className="text-yellow-400">★★★★★</span>
            </p>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-sm lg:block">
          <div className="rotate-2">
            <CourseCard
              title={t("landing.hero.demo.courseTitle")}
              category={t("landing.hero.demo.courseCategory")}
              categoryColor="blue"
              level={t("landing.hero.demo.courseLevel")}
              coverIcon={<BookOpenIcon className="size-12 text-white" />}
              lessonsLabel={t("landing.hero.demo.lessonsLabel")}
              durationLabel={t("landing.hero.demo.durationLabel")}
              priceLabel={t("landing.hero.demo.priceLabel")}
            />
          </div>
          <Card className="-rotate-3 absolute -bottom-6 -start-8 flex-row items-center gap-3 px-4 py-3 shadow-lg">
            <span className="flex size-10 items-center justify-center rounded-lg bg-mint-100 text-mint-600">
              <CheckIcon className="size-5" />
            </span>
            <span className="font-display text-sm font-bold text-foreground">
              {t("landing.hero.highlights.noCard")}
            </span>
          </Card>
        </div>
      </div>
    </section>
  );
}
