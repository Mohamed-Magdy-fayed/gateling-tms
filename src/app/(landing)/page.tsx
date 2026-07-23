import { FeaturesPreviewSection } from "@/features/marketing/nextjs/home/features-preview-section";
import { FinalCtaSection } from "@/features/marketing/nextjs/home/final-cta-section";
import { HeroSection } from "@/features/marketing/nextjs/home/hero-section";
import { LogosSection } from "@/features/marketing/nextjs/home/logos-section";
import { ProcessSection } from "@/features/marketing/nextjs/home/process-section";
import { TestimonialSection } from "@/features/marketing/nextjs/home/testimonial-section";
import { ValuePropositionSection } from "@/features/marketing/nextjs/home/value-proposition-section";

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
