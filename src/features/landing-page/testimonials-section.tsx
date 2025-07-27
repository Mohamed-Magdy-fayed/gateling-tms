'use client';

import { Star, Quote } from 'lucide-react';
import { H2, H3, P } from '@/components/ui/typography';
import { useTranslation } from '@/i18n/useTranslation';

export function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      id: 1,
      name: t('testimonials.clients.ahmedFathy.name'),
      company: t('testimonials.clients.ahmedFathy.company'),
      role: t('testimonials.clients.ahmedFathy.role'),
      content: t('testimonials.clients.ahmedFathy.content'),
      rating: 5,
      image: '/api/placeholder/60/60',
    },
    {
      id: 2,
      name: t('testimonials.clients.monaSamir.name'),
      company: t('testimonials.clients.monaSamir.company'),
      role: t('testimonials.clients.monaSamir.role'),
      content: t('testimonials.clients.monaSamir.content'),
      rating: 5,
      image: '/api/placeholder/60/60',
    },
    {
      id: 3,
      name: t('testimonials.clients.tarekMostafa.name'),
      company: t('testimonials.clients.tarekMostafa.company'),
      role: t('testimonials.clients.tarekMostafa.role'),
      content: t('testimonials.clients.tarekMostafa.content'),
      rating: 5,
      image: '/api/placeholder/60/60',
    },
  ];

  const stats = [
    {
      value: t('testimonials.stats.leadIncrease.value'),
      label: t('testimonials.stats.leadIncrease.label'),
      description: t('testimonials.stats.leadIncrease.description'),
    },
    {
      value: t('testimonials.stats.clientSatisfaction.value'),
      label: t('testimonials.stats.clientSatisfaction.label'),
      description: t('testimonials.stats.clientSatisfaction.description'),
    },
    {
      value: t('testimonials.stats.averageDelivery.value'),
      label: t('testimonials.stats.averageDelivery.label'),
      description: t('testimonials.stats.averageDelivery.description'),
    },
  ];

  return (
    <section className="py-20 bg-background" id="testimonials">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <H2 className="text-primary mb-4">
            {t('testimonials.header.title')}
          </H2>
          <P className="text-lg text-muted-foreground">
            {t('testimonials.header.description')}
          </P>
        </div>

        {/* Testimonials grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-muted/30 rounded-xl p-6 relative hover:bg-muted/50 transition-colors duration-300"
            >
              {/* Quote icon */}
              <div className="absolute -top-3 left-6 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Quote className="h-3 w-3" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <P className="text-foreground/80 mb-6 mt-0 italic">
                "{testimonial.content}"
              </P>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <H3 className="text-sm border-none pb-0 mb-1">{testimonial.name}</H3>
                  <P className="text-xs text-muted-foreground mt-0">
                    {testimonial.role}, {testimonial.company}
                  </P>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
          <div className="text-center mb-8">
            <H3 className="text-primary border-none pb-0 mb-2">
              {t('testimonials.statsSection.title')}
            </H3>
            <P className="text-muted-foreground mt-0">
              {t('testimonials.statsSection.description')}
            </P>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <H3 className="text-lg border-none pb-0 mb-2">{stat.label}</H3>
                <P className="text-muted-foreground text-sm mt-0">
                  {stat.description}
                </P>
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <P className="text-muted-foreground mb-6">
            {t('testimonials.trustIndicators.description')}
          </P>
          <div className="flex justify-center items-center gap-8 opacity-60">
            {/* Placeholder for industry badges/certifications */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded" />
              <span className="text-sm">{t('testimonials.trustIndicators.wordpressCertified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded" />
              <span className="text-sm">{t('testimonials.trustIndicators.googlePartner')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded" />
              <span className="text-sm">{t('testimonials.trustIndicators.sslSecured')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
