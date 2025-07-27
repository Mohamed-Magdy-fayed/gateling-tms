'use client';

import {
  MessageSquare,
  Lightbulb,
  Code,
  Rocket,
  ArrowRight
} from 'lucide-react';
import { H2, H3, P } from '@/components/ui/typography';
import { useTranslation } from '@/i18n/useTranslation';

export function ProcessSection() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: MessageSquare,
      title: t('process.steps.clientMeeting.title'),
      description: t('process.steps.clientMeeting.description'),
      details: [
        t('process.steps.clientMeeting.details.requirementsGathering'),
        t('process.steps.clientMeeting.details.goalSetting'),
      ],
    },
    {
      icon: Lightbulb,
      title: t('process.steps.implementation.title'),
      description: t('process.steps.implementation.description'),
      details: [
        t('process.steps.implementation.details.customDevelopment'),
        t('process.steps.implementation.details.featureSetup'),
      ],
    },
    {
      icon: Code,
      title: t('process.steps.launchTraining.title'),
      description: t('process.steps.launchTraining.description'),
      details: [
        t('process.steps.launchTraining.details.systemLaunch'),
        t('process.steps.launchTraining.details.clientTraining'),
      ],
    },
    {
      icon: Rocket,
      title: t('process.steps.supportConsultation.title'),
      description: t('process.steps.supportConsultation.description'),
      details: [
        t('process.steps.supportConsultation.details.ongoingSupport'),
        t('process.steps.supportConsultation.details.expertConsultation'),
      ],
    },
  ];

  return (
    <section className="py-20 bg-muted/30" id='process'>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <H2 className="text-primary mb-4">
            {t("process.header.title")}
          </H2>
          <P className="text-lg text-muted-foreground">
            {t("process.header.description")}
          </P>
        </div>

        {/* Process steps */}
        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-border/50" />

          <div className="grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-4 left-6 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="mb-4 pt-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <H3 className="text-lg mb-3 border-none pb-0">{step.title}</H3>
                  <P className="text-muted-foreground mb-4 mt-0">
                    {step.description}
                  </P>

                  {/* Details list */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-6">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline info */}
        <div className="mt-16 text-center bg-background rounded-xl p-8 shadow-sm border border-border/50">
          <H3 className="text-primary mb-4 border-none pb-0">
            {t("process.timeline.title")}
          </H3>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <div className="text-2xl font-bold text-primary mb-2">{t("process.timeline.timeframes.discoveryDays")}</div>
              <P className="text-muted-foreground text-sm mt-0">{t("process.timeline.discoveryPlanning")}</P>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-2">{t("process.timeline.timeframes.designWeeks")}</div>
              <P className="text-muted-foreground text-sm mt-0">{t("process.timeline.designDevelopment")}</P>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary mb-2">{t("process.timeline.timeframes.testingDays")}</div>
              <P className="text-muted-foreground text-sm mt-0">{t("process.timeline.testingLaunch")}</P>
            </div>
          </div>
          <P className="text-muted-foreground mt-6">
            {t("process.timeline.description")}
          </P>
        </div>
      </div>
    </section>
  );
}
