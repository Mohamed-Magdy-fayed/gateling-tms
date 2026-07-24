import type { Metadata } from "next";
import { FeaturesPreviewSection } from "@/features/marketing/nextjs/home/features-preview-section";
import { FinalCtaSection } from "@/features/marketing/nextjs/home/final-cta-section";
import { HeroSection } from "@/features/marketing/nextjs/home/hero-section";
import { LogosSection } from "@/features/marketing/nextjs/home/logos-section";
import { ProcessSection } from "@/features/marketing/nextjs/home/process-section";
import { TestimonialSection } from "@/features/marketing/nextjs/home/testimonial-section";
import { ValuePropositionSection } from "@/features/marketing/nextjs/home/value-proposition-section";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    // "absolute" — the root layout's title template would otherwise append
    // "| Gateling-TMS" a second time, since the brand name is already in
    // this title.
    titleMode: "absolute",
    en: {
      title:
        "Gateling-TMS — Your gateway to manage your online teaching business",
      description:
        "Sign up free, create your academy, and start managing classes and students in minutes — no sales call, no setup project.",
    },
    ar: {
      title: "Gateling-TMS — بوابتك لإدارة عملك التعليمي عبر الإنترنت",
      description:
        "سجّل مجانًا، أنشئ أكاديميتك، وابدأ في إدارة الحصص والطلاب خلال دقائق — بدون مكالمة مبيعات وبدون مشروع إعداد.",
    },
  });
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogosSection />
      <ValuePropositionSection />
      <FeaturesPreviewSection />
      <ProcessSection />
      <TestimonialSection />
      <FinalCtaSection />
    </>
  );
}
