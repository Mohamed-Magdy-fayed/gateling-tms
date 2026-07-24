import { FeaturesCtaSection } from "@/features/marketing/nextjs/features/features-cta-section";
import { FeaturesHeroSection } from "@/features/marketing/nextjs/features/features-hero-section";
import { FreeFeaturesSection } from "@/features/marketing/nextjs/features/free-features-section";
import { PremiumFeaturesSection } from "@/features/marketing/nextjs/features/premium-features-section";

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
