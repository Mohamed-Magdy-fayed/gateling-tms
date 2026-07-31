import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/features/marketing/nextjs/seo";
import { TestimonialsPage } from "@/features/marketing/nextjs/testimonials/testimonials-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLocalizedMetadata({
    en: {
      title: "Testimonials",
      description:
        "Feedback written by academies running on Gateling-TMS, published with their permission.",
    },
    ar: {
      title: "آراء العملاء",
      description:
        "آراء كتبتها أكاديميات تعمل على Gateling-TMS، ونُشرت بموافقتها.",
    },
  });
}

export default function Page() {
  return <TestimonialsPage />;
}
