import { getT } from "@/features/core/i18n/server";
import { CtaBanner } from "@/features/marketing/nextjs/components/cta-banner";

export async function FeaturesCtaSection() {
  const { t } = await getT();

  return (
    <CtaBanner
      title={t("features.cta.title")}
      subtitle={t("features.cta.description")}
      ctaLabel={t("features.cta.cta")}
      ctaHref="/get-started"
    />
  );
}
