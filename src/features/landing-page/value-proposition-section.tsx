"use client"

import {
  Zap,
  Shield,
  Smartphone,
  Search,
  Headphones,
  TrendingUp,
  Clock,
  Award,
  User2
} from 'lucide-react';
import { H2, H3, P } from '@/components/ui/typography';
import { useTranslation } from '@/i18n/useTranslation';

export function ValuePropositionSection() {
  const { t } = useTranslation();

  const mainBenefits = [
    {
      icon: Zap,
      title: t('valueProposition.mainBenefits.lightningFast.title'),
      description: t('valueProposition.mainBenefits.lightningFast.description'),
    },
    {
      icon: Smartphone,
      title: t('valueProposition.mainBenefits.mobileResponsive.title'),
      description: t('valueProposition.mainBenefits.mobileResponsive.description'),
    },
    {
      icon: User2,
      title: t('valueProposition.mainBenefits.userOptimized.title'),
      description: t('valueProposition.mainBenefits.userOptimized.description'),
    },
    {
      icon: Shield,
      title: t('valueProposition.mainBenefits.secureReliable.title'),
      description: t('valueProposition.mainBenefits.secureReliable.description'),
    },
  ];

  const additionalBenefits = [
    {
      icon: Clock,
      title: t('valueProposition.additionalBenefits.quickTurnaround.title'),
      description: t('valueProposition.additionalBenefits.quickTurnaround.description'),
    },
    {
      icon: Headphones,
      title: t('valueProposition.additionalBenefits.support.title'),
      description: t('valueProposition.additionalBenefits.support.description'),
    },
    {
      icon: TrendingUp,
      title: t('valueProposition.additionalBenefits.conversionFocused.title'),
      description: t('valueProposition.additionalBenefits.conversionFocused.description'),
    },
    {
      icon: Award,
      title: t('valueProposition.additionalBenefits.qualityGuaranteed.title'),
      description: t('valueProposition.additionalBenefits.qualityGuaranteed.description'),
    },
  ];

  return (
    <section className="bg-muted/30 py-12 sm:py-20 px-4 sm:px-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <H2 className="text-primary mb-4">
            {t('valueProposition.header.title')}
          </H2>
          <P className="text-lg text-muted-foreground text-balance">
            {t('valueProposition.header.description')}
          </P>
        </div>

        {/* Main benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {mainBenefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <H3 className="text-lg mb-2 border-none pb-0">{benefit.title}</H3>
              <P className="text-muted-foreground text-sm mt-0">
                {benefit.description}
              </P>
            </div>
          ))}
        </div>

        {/* Additional benefits */}
        <div className="bg-background rounded-2xl p-8 shadow-sm border border-border/50">
          <div className="text-center mb-8">
            <H3 className="text-primary border-none pb-0">
              {t('valueProposition.additionalBenefitsHeader')}
            </H3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalBenefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <H3 className="text-base mb-2 border-none pb-0">{benefit.title}</H3>
                <P className="text-muted-foreground text-sm mt-0">
                  {benefit.description}
                </P>
              </div>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">150+</div>
            <P className="text-muted-foreground text-sm mt-0">{t('valueProposition.stats.websitesDelivered')}</P>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">98%</div>
            <P className="text-muted-foreground text-sm mt-0">{t('valueProposition.stats.clientSatisfaction')}</P>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">5+</div>
            <P className="text-muted-foreground text-sm mt-0">{t('valueProposition.stats.yearsExperience')}</P>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <P className="text-muted-foreground text-sm mt-0">{t('valueProposition.stats.supportAvailable')}</P>
          </div>
        </div>
      </div>
    </section>
  );
}
