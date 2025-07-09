import { HeroSection } from "@/featurs/landing-page/hero-section";
import { Suspense } from "react";

export default async function Home() {

  return (
    <Suspense>
      <HeroSection />
      {/* <ValuePropositionSection />
      <TemplatePreviewSection />
      <ProcessSection />
      <TestimonialsSection />
      <FinalCtaSection /> */}
    </Suspense>
  );
}
