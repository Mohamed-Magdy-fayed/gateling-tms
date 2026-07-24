import { getT } from "@/features/core/i18n/server";
import { CtaBanner } from "@/features/marketing/nextjs/components/cta-banner";

export async function FinalCtaSection() {
  const { t } = await getT();

  return (
    <CtaBanner
      title={t("landing.finalCta.title")}
      subtitle={t("landing.finalCta.subtitle")}
      ctaLabel={t("landing.finalCta.cta")}
      ctaHref="/get-started"
      footnote={`${t("landing.hero.highlights.noCard")} · ${t("landing.hero.highlights.free")}`}
    />
  );
}
