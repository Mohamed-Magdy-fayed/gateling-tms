import type { Metadata } from "next";
import { FeaturesCtaSection } from "@/features/marketing/nextjs/features/features-cta-section";
import { FeaturesHeroSection } from "@/features/marketing/nextjs/features/features-hero-section";
import { FreeFeaturesSection } from "@/features/marketing/nextjs/features/free-features-section";
import { PremiumFeaturesSection } from "@/features/marketing/nextjs/features/premium-features-section";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Features",
      description:
        "Content Library, Learning Flow, and Live Classes are free today. HR, Course Store, CRM, Smart Forms, Community, and Support are coming soon.",
    },
    ar: {
      title: "الميزات",
      description:
        "مكتبة المحتوى ومسار التعلّم والفصول المباشرة متاحة مجانًا اليوم. الموارد البشرية ومتجر الدورات وإدارة العلاقات والنماذج الذكية والمجتمع والدعم قادمة قريبًا.",
    },
  });
}

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHeroSection />
      <FreeFeaturesSection />
      <PremiumFeaturesSection />
      <FeaturesCtaSection />
    </>
  );
}
