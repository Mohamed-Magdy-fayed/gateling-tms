import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { DarkModeSwitcher } from "../../../components/dark-mode-switcher";
import { getI18n } from "@/i18n/lib/get-translations";
import { auth } from "@/server/auth";
import { HeroSection } from "@/featurs/landing-page/hero-section";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t } = await getI18n(lang)
  const session = await auth()

  return (
    <>
      <HeroSection />
      {/* <ValuePropositionSection />
      <TemplatePreviewSection />
      <ProcessSection />
      <TestimonialsSection />
      <FinalCtaSection /> */}
    </>
  );
}
