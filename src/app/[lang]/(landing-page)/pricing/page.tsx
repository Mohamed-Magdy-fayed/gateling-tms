'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { H1, H2, P, Lead } from '@/components/ui/typography';
import {
    Check,
    Star,
    BookOpen,
    CheckCircle,
    Video,
    UserCheck,
    ShoppingCart,
    Users,
    FileText,
    Users2,
    HeadphonesIcon
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';
import { useScrollAnimation } from '@/hooks/use-animation';

export default function PricingPage() {
    const { t } = useTranslation();

    const pricingTiers = [
        {
            id: 'free',
            name: t('pricing.tiers.free.name'),
            description: t('pricing.tiers.free.description'),
            price: t('pricing.tiers.free.price'),
            period: t('pricing.tiers.free.period'),
            badge: null,
            popular: false,
            features: [
                {
                    icon: BookOpen,
                    name: t('pricing.features.contentLibrary.name'),
                    description: t('pricing.features.contentLibrary.description'),
                    included: true
                },
                {
                    icon: CheckCircle,
                    name: t('pricing.features.learningFlow.name'),
                    description: t('pricing.features.learningFlow.description'),
                    included: true
                },
                {
                    icon: Video,
                    name: t('pricing.features.liveClasses.name'),
                    description: t('pricing.features.liveClasses.description'),
                    included: true
                },
                {
                    icon: UserCheck,
                    name: t('pricing.features.hr.name'),
                    description: t('pricing.features.hr.description'),
                    included: false
                },
                {
                    icon: ShoppingCart,
                    name: t('pricing.features.courseStore.name'),
                    description: t('pricing.features.courseStore.description'),
                    included: false
                },
                {
                    icon: Users,
                    name: t('pricing.features.crm.name'),
                    description: t('pricing.features.crm.description'),
                    included: false
                },
                {
                    icon: FileText,
                    name: t('pricing.features.smartForms.name'),
                    description: t('pricing.features.smartForms.description'),
                    included: false
                },
                {
                    icon: Users2,
                    name: t('pricing.features.community.name'),
                    description: t('pricing.features.community.description'),
                    included: false
                },
                {
                    icon: HeadphonesIcon,
                    name: t('pricing.features.support.name'),
                    description: t('pricing.features.support.description'),
                    included: false
                }
            ],
            ctaText: t('pricing.tiers.free.cta'),
            ctaLink: '/get-started'
        },
        {
            id: 'basic',
            name: t('pricing.tiers.basic.name'),
            description: t('pricing.tiers.basic.description'),
            price: t('pricing.tiers.basic.price'),
            period: t('pricing.tiers.basic.period'),
            badge: null,
            popular: false,
            features: [
                {
                    icon: BookOpen,
                    name: t('pricing.features.contentLibrary.name'),
                    description: t('pricing.features.contentLibrary.description'),
                    included: true
                },
                {
                    icon: CheckCircle,
                    name: t('pricing.features.learningFlow.name'),
                    description: t('pricing.features.learningFlow.description'),
                    included: true
                },
                {
                    icon: Video,
                    name: t('pricing.features.liveClasses.name'),
                    description: t('pricing.features.liveClasses.description'),
                    included: true
                },
                {
                    icon: UserCheck,
                    name: t('pricing.features.hr.name'),
                    description: t('pricing.features.hr.description'),
                    included: true
                },
                {
                    icon: ShoppingCart,
                    name: t('pricing.features.courseStore.name'),
                    description: t('pricing.features.courseStore.description'),
                    included: true
                },
                {
                    icon: Users,
                    name: t('pricing.features.crm.name'),
                    description: t('pricing.features.crm.description'),
                    included: false
                },
                {
                    icon: FileText,
                    name: t('pricing.features.smartForms.name'),
                    description: t('pricing.features.smartForms.description'),
                    included: false
                },
                {
                    icon: Users2,
                    name: t('pricing.features.community.name'),
                    description: t('pricing.features.community.description'),
                    included: false
                },
                {
                    icon: HeadphonesIcon,
                    name: t('pricing.features.support.name'),
                    description: t('pricing.features.support.description'),
                    included: false
                }
            ],
            ctaText: t('pricing.tiers.basic.cta'),
            ctaLink: '/get-started?plan=basic'
        },
        {
            id: 'professional',
            name: t('pricing.tiers.professional.name'),
            description: t('pricing.tiers.professional.description'),
            price: t('pricing.tiers.professional.price'),
            period: t('pricing.tiers.professional.period'),
            badge: t('pricing.badges.popular'),
            popular: true,
            features: [
                {
                    icon: BookOpen,
                    name: t('pricing.features.contentLibrary.name'),
                    description: t('pricing.features.contentLibrary.description'),
                    included: true
                },
                {
                    icon: CheckCircle,
                    name: t('pricing.features.learningFlow.name'),
                    description: t('pricing.features.learningFlow.description'),
                    included: true
                },
                {
                    icon: Video,
                    name: t('pricing.features.liveClasses.name'),
                    description: t('pricing.features.liveClasses.description'),
                    included: true
                },
                {
                    icon: UserCheck,
                    name: t('pricing.features.hr.name'),
                    description: t('pricing.features.hr.description'),
                    included: true
                },
                {
                    icon: ShoppingCart,
                    name: t('pricing.features.courseStore.name'),
                    description: t('pricing.features.courseStore.description'),
                    included: true
                },
                {
                    icon: Users,
                    name: t('pricing.features.crm.name'),
                    description: t('pricing.features.crm.description'),
                    included: true
                },
                {
                    icon: FileText,
                    name: t('pricing.features.smartForms.name'),
                    description: t('pricing.features.smartForms.description'),
                    included: true
                },
                {
                    icon: Users2,
                    name: t('pricing.features.community.name'),
                    description: t('pricing.features.community.description'),
                    included: false
                },
                {
                    icon: HeadphonesIcon,
                    name: t('pricing.features.support.name'),
                    description: t('pricing.features.support.description'),
                    included: false
                }
            ],
            ctaText: t('pricing.tiers.professional.cta'),
            ctaLink: '/get-started?plan=professional'
        },
        {
            id: 'enterprise',
            name: t('pricing.tiers.enterprise.name'),
            description: t('pricing.tiers.enterprise.description'),
            price: t('pricing.tiers.enterprise.price'),
            period: t('pricing.tiers.enterprise.period'),
            badge: t('pricing.badges.enterprise'),
            popular: false,
            features: [
                {
                    icon: BookOpen,
                    name: t('pricing.features.contentLibrary.name'),
                    description: t('pricing.features.contentLibrary.description'),
                    included: true
                },
                {
                    icon: CheckCircle,
                    name: t('pricing.features.learningFlow.name'),
                    description: t('pricing.features.learningFlow.description'),
                    included: true
                },
                {
                    icon: Video,
                    name: t('pricing.features.liveClasses.name'),
                    description: t('pricing.features.liveClasses.description'),
                    included: true
                },
                {
                    icon: UserCheck,
                    name: t('pricing.features.hr.name'),
                    description: t('pricing.features.hr.description'),
                    included: true
                },
                {
                    icon: ShoppingCart,
                    name: t('pricing.features.courseStore.name'),
                    description: t('pricing.features.courseStore.description'),
                    included: true
                },
                {
                    icon: Users,
                    name: t('pricing.features.crm.name'),
                    description: t('pricing.features.crm.description'),
                    included: true
                },
                {
                    icon: FileText,
                    name: t('pricing.features.smartForms.name'),
                    description: t('pricing.features.smartForms.description'),
                    included: true
                },
                {
                    icon: Users2,
                    name: t('pricing.features.community.name'),
                    description: t('pricing.features.community.description'),
                    included: true
                },
                {
                    icon: HeadphonesIcon,
                    name: t('pricing.features.support.name'),
                    description: t('pricing.features.support.description'),
                    included: true
                }
            ],
            ctaText: t('pricing.tiers.enterprise.cta'),
            ctaLink: '/contact?plan=enterprise'
        }
    ];

    const heroAnimation = useScrollAnimation();
    const pricingAnimation = useScrollAnimation();
    const faqAnimation = useScrollAnimation();
    const ctaAnimation = useScrollAnimation();

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
                        {t('pricing.hero.title')}
                    </H1>
                    <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                        {t('pricing.hero.description')}
                    </Lead>
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className="text-sm text-muted-foreground">{t('pricing.hero.monthlyBilling')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{t('pricing.hero.monthly')}</span>
                            <div className="relative inline-block w-12 h-6 bg-gray-200 rounded-full cursor-pointer">
                                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></div>
                            </div>
                            <span className="text-sm">{t('pricing.hero.yearly')}</span>
                            <Badge variant="secondary" className="ml-2">{t('pricing.hero.save20')}</Badge>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={pricingAnimation.elementRef}
                        className={`grid lg:grid-cols-4 md:grid-cols-2 gap-8 transition-all duration-1000 ${pricingAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        {pricingTiers.map((tier, index) => (
                            <Card
                                key={tier.id}
                                className={`relative h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ${tier.popular ? 'border-orange-500 shadow-lg scale-105' : ''
                                    }`}
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                {tier.badge && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <Badge className="bg-orange-500 text-white">
                                            {tier.popular && <Star className="w-3 h-3 mr-1" />}
                                            {tier.badge}
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-4">
                                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                    <CardDescription className="text-sm">{tier.description}</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">{tier.price}</span>
                                        {tier.period && <span className="text-muted-foreground ml-1">{tier.period}</span>}
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <Button
                                        className={`w-full mb-6 hover:scale-105 transition-transform duration-300 ${tier.popular ? 'bg-orange-500 hover:bg-orange-600' : ''
                                            }`}
                                        variant={tier.popular ? 'default' : 'outline'}
                                        asChild
                                    >
                                        <Link href={tier.ctaLink}>{tier.ctaText}</Link>
                                    </Button>

                                    <div className="space-y-3">
                                        {tier.features.map((feature, featureIndex) => (
                                            <div
                                                key={featureIndex}
                                                className={`flex items-start gap-3 ${!feature.included ? 'opacity-50' : ''
                                                    }`}
                                            >
                                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${feature.included
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                                                    }`}>
                                                    {feature.included ? (
                                                        <Check className="w-3 h-3 rtl:scale-100" />
                                                    ) : (
                                                        <span className="w-2 h-2 bg-current rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <feature.icon className="w-4 h-4 text-orange-500 flex-shrink-0 rtl:scale-100" />
                                                        <span className="text-sm font-medium">{feature.name}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="container mx-auto px-4">
                    <div
                        ref={faqAnimation.elementRef}
                        className={`text-center mb-16 transition-all duration-1000 ${faqAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-4">{t('pricing.faq.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('pricing.faq.description')}
                        </P>
                    </div>

                    <div className={`max-w-3xl mx-auto space-y-6 transition-all duration-1000 delay-300 ${faqAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        {[1, 2, 3, 4, 5].map((faqIndex) => (
                            <Card key={faqIndex} className="hover:shadow-md transition-shadow duration-300">
                                <CardHeader>
                                    <CardTitle className="text-lg">{t(`pricing.faq.questions.q${faqIndex}.question` as any)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <P className="text-muted-foreground">{t(`pricing.faq.questions.q${faqIndex}.answer` as any)}</P>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 text-center">
                    <div
                        ref={ctaAnimation.elementRef}
                        className={`max-w-3xl mx-auto transition-all duration-1000 ${ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-6">{t('pricing.cta.title')}</H2>
                        <P className="text-muted-foreground mb-8">
                            {t('pricing.cta.description')}
                        </P>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/get-started">{t('pricing.cta.primaryButton')}</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/contact">{t('pricing.cta.secondaryButton')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
