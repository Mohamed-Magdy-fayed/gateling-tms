import type { Metadata } from "next";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { LegalPageLayout } from "@/features/marketing/nextjs/legal/legal-page-layout";
import { privacyContent } from "@/features/marketing/nextjs/legal/privacy-content";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Privacy Policy",
      description:
        "What information Gateling-TMS collects, why, and how it's handled for organization admins, teachers, and students.",
    },
    ar: {
      title: "سياسة الخصوصية",
      description:
        "المعلومات التي تجمعها Gateling-TMS، وسبب جمعها، وكيفية التعامل معها لمسؤولي المؤسسات والمعلمين والطلاب.",
    },
  });
}

export default async function PrivacyPage() {
  const locale = await getLocaleCookie();
  const { t } = await getT();

  return (
    <LegalPageLayout
      content={privacyContent[locale === "ar" ? "ar" : "en"]}
      lastUpdatedLabel={t("legal.lastUpdated")}
    />
  );
}
