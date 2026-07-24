import type { Metadata } from "next";
import { AboutBeliefsSection } from "@/features/marketing/nextjs/about/about-beliefs-section";
import { AboutCtaSection } from "@/features/marketing/nextjs/about/about-cta-section";
import { AboutHeroSection } from "@/features/marketing/nextjs/about/about-hero-section";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "About",
      description:
        "Gateling-TMS is a straightforward training management system for online academies — instant onboarding, Excel-first, free means free, bilingual by design.",
    },
    ar: {
      title: "من نحن",
      description:
        "Gateling-TMS نظام مباشر لإدارة التدريب للأكاديميات عبر الإنترنت — بداية فورية، إكسل أولًا، مجاني يعني مجاني، وثنائي اللغة بالتصميم.",
    },
  });
}

export default function AboutPage() {
  return (
    <>
      <AboutHeroSection />
      <AboutBeliefsSection />
      <AboutCtaSection />
    </>
  );
}
