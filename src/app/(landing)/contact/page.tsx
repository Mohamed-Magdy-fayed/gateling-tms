import type { Metadata } from "next";
import { ContactHeroSection } from "@/features/marketing/nextjs/contact/contact-hero-section";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Contact",
      description:
        "Questions, feedback, or something not working? Send Gateling-TMS a message and we'll get back to you.",
    },
    ar: {
      title: "تواصل معنا",
      description:
        "أسئلة أو ملاحظات أو شيء لا يعمل؟ أرسل رسالة إلى Gateling-TMS وسنعاود التواصل معك.",
    },
  });
}

export default function ContactPage() {
  return <ContactHeroSection />;
}
