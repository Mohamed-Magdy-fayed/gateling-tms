import type { Metadata } from "next";
import { PricingFaqSection } from "@/features/marketing/nextjs/pricing/pricing-faq-section";
import { PricingHeroSection } from "@/features/marketing/nextjs/pricing/pricing-hero-section";
import { PricingPlansSection } from "@/features/marketing/nextjs/pricing/pricing-plans-section";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Pricing",
      description:
        "Free plan with no time limit, no credit card required. Basic, Professional, and Enterprise plans are coming soon.",
    },
    ar: {
      title: "الأسعار",
      description:
        "خطة مجانية بلا حد زمني وبلا حاجة لبطاقة ائتمان. الخطط الأساسية والاحترافية وخطة المؤسسات قادمة قريبًا.",
    },
  });
}

export default function PricingPage() {
  return (
    <>
      <PricingHeroSection />
      <PricingPlansSection />
      <PricingFaqSection />
    </>
  );
}
