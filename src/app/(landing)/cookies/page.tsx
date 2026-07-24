import type { Metadata } from "next";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { cookiesContent } from "@/features/marketing/nextjs/legal/cookies-content";
import { LegalPageLayout } from "@/features/marketing/nextjs/legal/legal-page-layout";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Cookies Policy",
      description:
        "The small number of essential cookies Gateling-TMS uses — no third-party advertising or tracking.",
    },
    ar: {
      title: "سياسة ملفات تعريف الارتباط",
      description:
        "ملفات تعريف الارتباط الأساسية القليلة التي تستخدمها Gateling-TMS — بلا إعلانات أو تتبع من أطراف ثالثة.",
    },
  });
}

export default async function CookiesPage() {
  const locale = await getLocaleCookie();
  const { t } = await getT();

  return (
    <LegalPageLayout
      content={cookiesContent[locale === "ar" ? "ar" : "en"]}
      lastUpdatedLabel={t("legal.lastUpdated")}
    />
  );
}
