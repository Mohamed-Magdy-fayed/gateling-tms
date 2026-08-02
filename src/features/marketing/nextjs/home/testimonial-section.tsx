import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT } from "@/features/core/i18n/server";
import { getPublicTestimonials } from "@/features/marketing/nextjs/testimonials/public-data";
import { TestimonialCard } from "@/features/marketing/nextjs/testimonials/testimonial-card";

/**
 * Real feedback from real academies, or nothing at all.
 *
 * `listPublic` only ever returns quotes whose author consented *and* which
 * Gateling approved, so there is no state in which this section shows words
 * nobody agreed to publish. When there are none, the section doesn't render —
 * an empty "what academies say" heading is its own kind of claim.
 */
export async function TestimonialSection() {
  const { t } = await getT();
  const testimonials = await getPublicTestimonials(2);

  if (testimonials.length === 0) return null;

  const [featured, ...rest] = testimonials;

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
      <p className="text-center font-bold text-primary text-xs uppercase tracking-wider">
        {t("landing.testimonial.eyebrow")}
      </p>

      <div className="mt-6 space-y-4">
        <TestimonialCard testimonial={featured} tone="feature" />
        {rest.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" render={<Link href="/testimonials" />}>
          {t("landing.testimonial.readMore")}
        </Button>
      </div>
    </section>
  );
}
