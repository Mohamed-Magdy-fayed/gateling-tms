'use client';

import Link from 'next/link';
import { ArrowRight, Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { H2, H3, P } from '@/components/ui/typography';
import { APP_CONFIG } from '@/constants';
import { useTranslation } from '@/i18n/useTranslation';

export function FinalCtaSection() {
  const { t } = useTranslation();

  const contactMethods = [
    {
      icon: Phone,
      title: t('finalCta.contactMethods.callUs.title'),
      description: t('finalCta.contactMethods.callUs.description'),
      action: t('finalCta.contactMethods.callUs.action'),
      href: `tel:${APP_CONFIG.phone}`,
      value: APP_CONFIG.phone,
    },
    {
      icon: Mail,
      title: t('finalCta.contactMethods.emailUs.title'),
      description: t('finalCta.contactMethods.emailUs.description'),
      action: t('finalCta.contactMethods.emailUs.action'),
      href: `mailto:${APP_CONFIG.email}`,
      value: APP_CONFIG.email,
    },
    {
      icon: MessageCircle,
      title: t('finalCta.contactMethods.liveChat.title'),
      description: t('finalCta.contactMethods.liveChat.description'),
      action: t('finalCta.contactMethods.liveChat.action'),
      href: '#',
      value: t('finalCta.contactMethods.liveChat.value'),
    },
  ];

  const urgencyFactors = [
    t('finalCta.urgencyFactors.freeConsultation'),
    t('finalCta.urgencyFactors.priorityBooking'),
    t('finalCta.urgencyFactors.specialPricing'),
    t('finalCta.urgencyFactors.moneyBackGuarantee'),
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <div className="mb-12">
            <H2 className="text-primary mb-4">
              {t('finalCta.mainCta.title')}
            </H2>
            <P className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('finalCta.mainCta.description')}
            </P>

            {/* Primary CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/quote">
                  {t('finalCta.mainCta.getQuoteButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/templates">
                  {t('finalCta.mainCta.browseTemplatesButton')}
                </Link>
              </Button>
            </div>

            {/* Urgency factors */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {urgencyFactors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact methods */}
          <div className="bg-background/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-border/50">
            <H3 className="text-primary mb-6 border-none pb-0">
              {t('finalCta.contactMethods.header')}
            </H3>

            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <method.icon className="h-8 w-8 text-primary" />
                  </div>
                  <H3 className="text-lg mb-2 border-none pb-0">{method.title}</H3>
                  <P className="text-muted-foreground text-sm mb-3 mt-0">
                    {method.description}
                  </P>
                  <P className="text-sm font-medium text-foreground mb-3 mt-0">
                    {method.value}
                  </P>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={method.href}>
                      {method.action}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Final reassurance */}
          <div className="mt-12 text-center">
            <P className="text-muted-foreground mb-4">
              {t('finalCta.finalReassurance.secureInfo')}
            </P>
            <P className="text-sm text-muted-foreground">
              {t('finalCta.finalReassurance.stats')}
            </P>
          </div>
        </div>
      </div>
    </section>
  );
}
