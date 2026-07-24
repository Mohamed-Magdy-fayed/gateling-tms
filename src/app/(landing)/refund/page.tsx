import type { Metadata } from "next";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { LegalPageLayout } from "@/features/marketing/nextjs/legal/legal-page-layout";
import { refundContent } from "@/features/marketing/nextjs/legal/refund-content";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Refund Policy",
      description:
        "Gateling-TMS currently offers only the Free plan, which has no cost. A full refund policy will be published before any paid plan launches.",
    },
    ar: {
      title: "سياسة الاسترداد",
      description:
        "تقدّم Gateling-TMS حاليًا الخطة المجانية فقط، وهي بلا تكلفة. سيتم نشر سياسة استرداد كاملة قبل إطلاق أي خطة مدفوعة.",
    },
  });
}

export default async function RefundPage() {
  const locale = await getLocaleCookie();
  const { t } = await getT();

  return (
    <LegalPageLayout
      content={refundContent[locale === "ar" ? "ar" : "en"]}
      lastUpdatedLabel={t("legal.lastUpdated")}
    />
  );
}
