import { FeaturesPreviewSection } from "@/features/marketing/nextjs/home/features-preview-section";
import { FinalCtaSection } from "@/features/marketing/nextjs/home/final-cta-section";
import { HeroSection } from "@/features/marketing/nextjs/home/hero-section";
import { ProcessSection } from "@/features/marketing/nextjs/home/process-section";
import { ValuePropositionSection } from "@/features/marketing/nextjs/home/value-proposition-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropositionSection />
      <FeaturesPreviewSection />
      <ProcessSection />
      <FinalCtaSection />
    </>
  );
}
