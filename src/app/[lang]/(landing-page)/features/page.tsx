'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { H1, H2, H3, P, Lead } from '@/components/ui/typography';
import {
    BookOpen,
    Users,
    Video,
    UserCheck,
    ShoppingCart,
    FileText,
    Users2,
    HeadphonesIcon,
    Crown,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';
import { useScrollAnimation } from '@/hooks/use-animation';

export default function FeaturesPage() {
    const { t } = useTranslation();

    const features = [
        {
            icon: BookOpen,
            title: t('features.services.contentLibrary.title'),
            description: t('features.services.contentLibrary.description'),
            isFree: true,
            features: [
                t('features.services.contentLibrary.features.digitalResources'),
                t('features.services.contentLibrary.features.mediaManagement'),
                t('features.services.contentLibrary.features.contentOrganization'),
                t('features.services.contentLibrary.features.searchFiltering')
            ]
        },
        {
            icon: CheckCircle,
            title: t('features.services.learningFlow.title'),
            description: t('features.services.learningFlow.description'),
            isFree: true,
            features: [
                t('features.services.learningFlow.features.courseStructure'),
                t('features.services.learningFlow.features.progressTracking'),
                t('features.services.learningFlow.features.assessments'),
                t('features.services.learningFlow.features.certificates')
            ]
        },
        {
            icon: Video,
            title: t('features.services.liveClasses.title'),
            description: t('features.services.liveClasses.description'),
            isFree: true,
            features: [
                t('features.services.liveClasses.features.hdVideoStreaming'),
                t('features.services.liveClasses.features.interactiveWhiteboard'),
                t('features.services.liveClasses.features.recordingCapabilities'),
                t('features.services.liveClasses.features.screenSharing')
            ]
        },
        {
            icon: UserCheck,
            title: t('features.services.hr.title'),
            description: t('features.services.hr.description'),
            isFree: false,
            features: [
                t('features.services.hr.features.staffManagement'),
                t('features.services.hr.features.payrollIntegration'),
                t('features.services.hr.features.performanceTracking'),
                t('features.services.hr.features.attendanceMonitoring')
            ]
        },
        {
            icon: ShoppingCart,
            title: t('features.services.courseStore.title'),
            description: t('features.services.courseStore.description'),
            isFree: false,
            features: [
                t('features.services.courseStore.features.onlineMarketplace'),
                t('features.services.courseStore.features.paymentProcessing'),
                t('features.services.courseStore.features.coursePackaging'),
                t('features.services.courseStore.features.salesAnalytics')
            ]
        },
        {
            icon: Users,
            title: t('features.services.crm.title'),
            description: t('features.services.crm.description'),
            isFree: false,
            features: [
                t('features.services.crm.features.leadManagement'),
                t('features.services.crm.features.studentProfiles'),
                t('features.services.crm.features.communicationHistory'),
                t('features.services.crm.features.enrollmentTracking')
            ]
        },
        {
            icon: FileText,
            title: t('features.services.smartForms.title'),
            description: t('features.services.smartForms.description'),
            isFree: false,
            features: [
                t('features.services.smartForms.features.customForms'),
                t('features.services.smartForms.features.dataCollection'),
                t('features.services.smartForms.features.automatedWorkflows'),
                t('features.services.smartForms.features.integrationCapabilities')
            ]
        },
        {
            icon: Users2,
            title: t('features.services.community.title'),
            description: t('features.services.community.description'),
            isFree: false,
            features: [
                t('features.services.community.features.discussionForums'),
                t('features.services.community.features.studentGroups'),
                t('features.services.community.features.socialLearning'),
                t('features.services.community.features.peerInteraction')
            ]
        },
        {
            icon: HeadphonesIcon,
            title: t('features.services.support.title'),
            description: t('features.services.support.description'),
            isFree: false,
            features: [
                t('features.services.support.features.ticketingSystem'),
                t('features.services.support.features.liveChat'),
                t('features.services.support.features.knowledgeBase'),
                t('features.services.support.features.prioritySupport')
            ]
        }
    ];

    const process = [
        {
            step: '01',
            title: t('features.process.setup.title'),
            description: t('features.process.setup.description')
        },
        {
            step: '02',
            title: t('features.process.configuration.title'),
            description: t('features.process.configuration.description')
        },
        {
            step: '03',
            title: t('features.process.training.title'),
            description: t('features.process.training.description')
        },
        {
            step: '04',
            title: t('features.process.support.title'),
            description: t('features.process.support.description')
        }
    ];

    const heroAnimation = useScrollAnimation();
    const featuresAnimation = useScrollAnimation();
    const processAnimation = useScrollAnimation();
    const ctaAnimation = useScrollAnimation();

    // Separate free and paid features
    const freeFeatures = features.filter(feature => feature.isFree);
    const paidFeatures = features.filter(feature => !feature.isFree);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
                <div
                    ref={heroAnimation.elementRef}
                    className={`container mx-auto px-4 text-center transition-all duration-1000 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    <H1 className="mb-6 max-w-4xl mx-auto">
                        {t('features.hero.title')}
                    </H1>
                    <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                        {t('features.hero.description')}
                    </Lead>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild className="hover:scale-105 transition-transform duration-300">
                            <Link href="/get-started">{t('features.hero.primaryButton')}</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-transform duration-300">
                            <Link href="/contact">{t('features.hero.secondaryButton')}</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Free Features Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={featuresAnimation.elementRef}
                        className={`text-center mb-16 transition-all duration-1000 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-4">{t('features.freeFeatures.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('features.freeFeatures.description')}
                        </P>
                    </div>

                    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ${featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        {freeFeatures.map((feature, index) => (
                            <Card key={index} className="h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group border-green-200 dark:border-green-800">
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors duration-300">
                                            <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                            {t('features.badges.free')}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {feature.features.map((featureItem, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-3 group-hover:scale-125 transition-transform duration-300" />
                                                {featureItem}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Features Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <H2 className="mb-4">{t('features.premiumFeatures.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('features.premiumFeatures.description')}
                        </P>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paidFeatures.map((feature, index) => (
                            <Card key={index} className="h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group border-orange-200 dark:border-orange-800">
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                            <feature.icon className="w-6 h-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                            <Crown className="w-3 h-3 mr-1" />
                                            {t('features.badges.premium')}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {feature.features.map((featureItem, featureIndex) => (
                                            <li key={featureIndex} className="flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-3 group-hover:scale-125 transition-transform duration-300" />
                                                {featureItem}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={processAnimation.elementRef}
                        className={`text-center mb-16 transition-all duration-1000 ${processAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-4">{t('features.process.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('features.process.description')}
                        </P>
                    </div>

                    <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 delay-300 ${processAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        {process.map((step, index) => (
                            <div key={index} className="text-center group">
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">{step.step}</span>
                                </div>
                                <H3 className="mb-4">{step.title}</H3>
                                <P className="text-muted-foreground text-sm">{step.description}</P>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
                <div className="container mx-auto px-4 text-center">
                    <div
                        ref={ctaAnimation.elementRef}
                        className={`max-w-3xl mx-auto transition-all duration-1000 ${ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-6">{t('features.cta.title')}</H2>
                        <P className="text-muted-foreground mb-8">
                            {t('features.cta.description')}
                        </P>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/get-started">{t('features.cta.primaryButton')}</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/demo">{t('features.cta.secondaryButton')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
