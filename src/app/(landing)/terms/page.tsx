import type { Metadata } from "next";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { LegalPageLayout } from "@/features/marketing/nextjs/legal/legal-page-layout";
import { termsContent } from "@/features/marketing/nextjs/legal/terms-content";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Terms of Service",
      description: "The terms that govern your use of Gateling-TMS.",
    },
    ar: {
      title: "شروط الخدمة",
      description: "الشروط التي تحكم استخدامك لـ Gateling-TMS.",
    },
  });
}

export default async function TermsPage() {
  const locale = await getLocaleCookie();
  const { t } = await getT();

  return (
    <LegalPageLayout
      content={termsContent[locale === "ar" ? "ar" : "en"]}
      lastUpdatedLabel={t("legal.lastUpdated")}
    />
  );
}
