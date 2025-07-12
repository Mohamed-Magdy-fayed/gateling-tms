import { HeroSection } from "@/featurs/landing-page/hero-section";
import { Suspense } from "react";

export default async function Home() {

  return (
    <Suspense>
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
      <HeroSection />
      {/* <ValuePropositionSection />
      <TemplatePreviewSection />
      <ProcessSection />
      <TestimonialsSection />
      <FinalCtaSection /> */}
    </Suspense>
  );
}
