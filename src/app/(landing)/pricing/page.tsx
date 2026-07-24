import { PricingFaqSection } from "@/features/marketing/nextjs/pricing/pricing-faq-section";
import { PricingHeroSection } from "@/features/marketing/nextjs/pricing/pricing-hero-section";
import { PricingPlansSection } from "@/features/marketing/nextjs/pricing/pricing-plans-section";

export default function PricingPage() {
  return (
    <>
      <PricingHeroSection />
      <PricingPlansSection />
      <PricingFaqSection />
    </>
  );
}
