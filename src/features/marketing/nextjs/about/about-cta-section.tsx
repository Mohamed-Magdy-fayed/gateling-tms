import { getT } from "@/features/core/i18n/server";
import { CtaBanner } from "@/features/marketing/nextjs/components/cta-banner";

export async function AboutCtaSection() {
  const { t } = await getT();

  return (
    <CtaBanner
      title={t("about.cta.title")}
      subtitle={t("about.cta.description")}
      ctaLabel={t("about.cta.cta")}
      ctaHref="/get-started"
    />
  );
}
