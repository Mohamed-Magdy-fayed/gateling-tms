import { MessageSquareQuoteIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/features/core/i18n/server";
import { CtaBanner } from "@/features/marketing/nextjs/components/cta-banner";
import { getPublicTestimonials } from "@/features/marketing/nextjs/testimonials/public-data";
import { TestimonialCard } from "@/features/marketing/nextjs/testimonials/testimonial-card";

export async function TestimonialsPage() {
  const { t } = await getT();
  const testimonials = await getPublicTestimonials();

  return (
    <>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="font-bold text-primary text-xs uppercase tracking-wider">
          {t("testimonials.page.eyebrow")}
        </p>
        <h1 className="mt-4 text-balance font-display font-bold text-4xl text-foreground sm:text-5xl">
          {t("testimonials.page.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          {t("testimonials.page.description")}
        </p>

        <div className="mt-12 space-y-4">
          {testimonials.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuoteIcon />}
              title={t("testimonials.page.empty")}
            />
          ) : (
            testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                tone={index === 0 ? "feature" : "plain"}
              />
            ))
          )}
        </div>
      </section>

      <CtaBanner
        title={t("landing.finalCta.title")}
        subtitle={t("landing.finalCta.subtitle")}
        ctaLabel={t("landing.finalCta.cta")}
        ctaHref="/get-started"
      />
    </>
  );
}
