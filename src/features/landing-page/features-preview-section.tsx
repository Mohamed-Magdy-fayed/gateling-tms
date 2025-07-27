'use client';

import Link from 'next/link';
import { ArrowRight, CircleQuestionMarkIcon, ExternalLink, FilePenIcon, PlayCircleIcon, StoreIcon, UserPlusIcon, UsersIcon, UserSquare2Icon, ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { H2, H3, P } from '@/components/ui/typography';
import { useTranslation } from '@/i18n/useTranslation';

export function FeaturePreviewSection() {
  const { t } = useTranslation();

  const featuredFeatures = [
    {
      id: '1',
      name: t('featuresPreview.featuredFeatures.courseManagement.name'),
      description: t('featuresPreview.featuredFeatures.courseManagement.description'),
      category: 'courseManagement',
      isPremium: false,
      demoUrl: '/demo/course-management',
    },
    {
      id: '2',
      name: t('featuresPreview.featuredFeatures.learningFlow.name'),
      description: t('featuresPreview.featuredFeatures.learningFlow.description'),
      category: 'learningFlow',
      isPremium: false,
      demoUrl: '/demo/learning-flow',
    },
    {
      id: '3',
      name: t('featuresPreview.featuredFeatures.liveClasses.name'),
      description: t('featuresPreview.featuredFeatures.liveClasses.description'),
      category: 'liveClasses',
      isPremium: false,
      demoUrl: '/demo/live-classes',
    },
    {
      id: '4',
      name: t('featuresPreview.featuredFeatures.hrManagement.name'),
      description: t('featuresPreview.featuredFeatures.hrManagement.description'),
      category: 'hrManagement',
      isPremium: true,
      demoUrl: '/demo/hr-management',
    },
    {
      id: '5',
      name: t('featuresPreview.featuredFeatures.courseStore.name'),
      description: t('featuresPreview.featuredFeatures.courseStore.description'),
      category: 'courseStore',
      isPremium: true,
      demoUrl: '/demo/course-store',
    },
    {
      id: '6',
      name: t('featuresPreview.featuredFeatures.crmIntegration.name'),
      description: t('featuresPreview.featuredFeatures.crmIntegration.description'),
      category: 'crmIntegration',
      isPremium: true,
      demoUrl: '/demo/crm-integration',
    },
    {
      id: '7',
      name: t('featuresPreview.featuredFeatures.smartForms.name'),
      description: t('featuresPreview.featuredFeatures.smartForms.description'),
      category: 'smartForms',
      isPremium: true,
      demoUrl: '/demo/smart-forms',
    },
    {
      id: '8',
      name: t('featuresPreview.featuredFeatures.communityBuilding.name'),
      description: t('featuresPreview.featuredFeatures.communityBuilding.description'),
      category: 'communityBuilding',
      isPremium: true,
      demoUrl: '/demo/community-building',
    },
  ];

  const FEATURES = {
    courseManagement: {
      label: t('featuresPreview.featuredFeatures.courseManagement.name'),
      description: t('featuresPreview.featuredFeatures.courseManagement.description'),
      icon: <UserSquare2Icon />,
    },
    learningFlow: {
      label: t('featuresPreview.featuredFeatures.learningFlow.name'),
      description: t('featuresPreview.featuredFeatures.learningFlow.description'),
      icon: <UserSquare2Icon />,
    },
    liveClasses: {
      label: t('featuresPreview.featuredFeatures.liveClasses.name'),
      description: t('featuresPreview.featuredFeatures.liveClasses.description'),
      icon: <UserSquare2Icon />,
    },
    hrManagement: {
      label: t('featuresPreview.featuredFeatures.hrManagement.name'),
      description: t('featuresPreview.featuredFeatures.hrManagement.description'),
      icon: <UserSquare2Icon />,
    },
    courseStore: {
      label: t('featuresPreview.featuredFeatures.courseStore.name'),
      description: t('featuresPreview.featuredFeatures.courseStore.description'),
      icon: <StoreIcon />,
    },
    crmIntegration: {
      label: t('featuresPreview.featuredFeatures.crmIntegration.name'),
      description: t('featuresPreview.featuredFeatures.crmIntegration.description'),
      icon: <UserPlusIcon />,
    },
    smartForms: {
      label: t('featuresPreview.featuredFeatures.smartForms.name'),
      description: t('featuresPreview.featuredFeatures.smartForms.description'),
      icon: <FilePenIcon />,
    },
    communityBuilding: {
      label: t('featuresPreview.featuredFeatures.communityBuilding.name'),
      description: t('featuresPreview.featuredFeatures.communityBuilding.description'),
      icon: <UsersIcon />,
    },
    support: {
      label: t('featuresPreview.featuredFeatures.support.name'),
      description: t('featuresPreview.featuredFeatures.support.description'),
      icon: <CircleQuestionMarkIcon />
    },
  } as const;

  const categories = Object.entries(FEATURES).slice(3);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <H2 className="text-primary mb-4">
            {t('featuresPreview.header.title')}
          </H2>
          <P className="text-lg text-muted-foreground">
            {t('featuresPreview.header.description')}
          </P>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {categories.map(([key, category]) => (
            <Link
              key={key}
              href={`/features?feature=${key}`}
              className="group bg-muted/50 hover:bg-muted rounded-lg p-4 text-center transition-all duration-200 hover:scale-105"
            >
              <div className="text-2xl mb-2">
                <div className="grid place-content-center text-primary [&>svg]:scale-100">
                  {category.icon}
                </div>
              </div>
              <P className="text-sm font-medium mt-0 group-hover:text-primary transition-colors">
                {category.label}
              </P>
            </Link>
          ))}
        </div>

        {/* Featured templates */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredFeatures.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col bg-background rounded-xl overflow-hidden shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Feature image */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {/* Placeholder for template screenshot */}
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-lg mx-auto mb-2" />
                    <P className="text-xs text-muted-foreground mt-0">{t('featuresPreview.templateImagePlaceholder')}</P>
                  </div>
                </div>

                {/* Premium badge */}
                {template.isPremium && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                    {t('featuresPreview.premiumBadge')}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="grid place-content-center">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={template.demoUrl}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t('featuresPreview.demoButton')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Feature info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <H3 className="text-base border-none pb-0">{template.name}</H3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {FEATURES[template.category as keyof typeof FEATURES]?.label}
                  </span>
                </div>
                <P className="text-sm text-muted-foreground mt-0">
                  {template.description}
                </P>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium text-primary">
                    {template.isPremium ? t('featuresPreview.premiumText') : t('featuresPreview.freeText')}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={template.demoUrl}>
                      {t('featuresPreview.viewDetailsButton')}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
          <H3 className="text-2xl mb-4 border-none pb-0">{t("featuresPreview.cta.title")}</H3>
          <P className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t("featuresPreview.cta.description")}
          </P>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/get-started">
                <ZapIcon className="mr-2 h-5 w-5" />
                {t("featuresPreview.cta.startTrialButton")}
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/demo">
                <PlayCircleIcon className="mr-2 h-5 w-5" />
                {t("featuresPreview.cta.watchDemoButton")}
              </Link>
            </Button>
          </div>

          <P className="text-sm text-muted-foreground mt-4">
            {t("featuresPreview.cta.trialNote")}
          </P>
        </div>
      </div>
    </section>
  );
}
