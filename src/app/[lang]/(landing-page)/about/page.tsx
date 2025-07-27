'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { H1, H2, H3, P, Lead } from '@/components/ui/typography';
import {
    Users,
    Award,
    Globe,
    Target,
    Shield,
    BookOpen,
    GraduationCap,
    Building,
    Lightbulb,
    Handshake,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/useTranslation';
import { useScrollAnimation } from '@/hooks/use-animation';

export default function AboutPage() {
    const { t } = useTranslation();

    const stats = [
        { icon: Building, label: t('about.stats.institutions.label'), value: t('about.stats.institutions.value') },
        { icon: Users, label: t('about.stats.activeStudents.label'), value: t('about.stats.activeStudents.value') },
        { icon: BookOpen, label: t('about.stats.coursesManaged.label'), value: t('about.stats.coursesManaged.value') },
        { icon: Globe, label: t('about.stats.countriesServed.label'), value: t('about.stats.countriesServed.value') },
        { icon: Award, label: t('about.stats.yearsInBusiness.label'), value: t('about.stats.yearsInBusiness.value') }
    ];

    const values = [
        {
            icon: Lightbulb,
            title: t('about.values.innovation.title'),
            description: t('about.values.innovation.description')
        },
        {
            icon: GraduationCap,
            title: t('about.values.studentSuccess.title'),
            description: t('about.values.studentSuccess.description')
        },
        {
            icon: Target,
            title: t('about.values.operationalExcellence.title'),
            description: t('about.values.operationalExcellence.description')
        },
        {
            icon: Handshake,
            title: t('about.values.partnership.title'),
            description: t('about.values.partnership.description')
        },
        {
            icon: Shield,
            title: t('about.values.integrity.title'),
            description: t('about.values.integrity.description')
        }
    ];

    const whyChooseUs = [
        t('about.whyChooseUs.exceptionalSupport'),
        t('about.whyChooseUs.scalableSolutions'),
        t('about.whyChooseUs.userCentricInterface'),
        t('about.whyChooseUs.comprehensiveToolset'),
        t('about.whyChooseUs.costReduction')
    ];

    const heroAnimation = useScrollAnimation();
    const statsAnimation = useScrollAnimation();
    const storyAnimation = useScrollAnimation();
    const valuesAnimation = useScrollAnimation();
    const founderAnimation = useScrollAnimation();
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
                        {t('about.hero.title')}
                    </H1>
                    <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                        {t('about.hero.description')}
                    </Lead>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={statsAnimation.elementRef}
                        className={`grid md:grid-cols-2 lg:grid-cols-5 gap-8 transition-all duration-1000 delay-200 ${statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center group hover:scale-105 transition-transform duration-300"
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                    <stat.icon className="w-8 h-8 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <H3 className="text-3xl font-bold mb-2">{stat.value}</H3>
                                <P className="text-muted-foreground">{stat.label}</P>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div
                            ref={storyAnimation.elementRef}
                            className={`text-center mb-16 transition-all duration-1000 ${storyAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <H2 className="mb-6">{t('about.story.title')}</H2>
                            <P className="text-muted-foreground text-lg leading-relaxed">
                                {t('about.story.description')}
                            </P>
                        </div>

                        <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-300 ${storyAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}>
                            <div>
                                <H3 className="mb-4">{t('about.mission.title')}</H3>
                                <P className="text-muted-foreground mb-6">
                                    {t('about.mission.description')}
                                </P>
                                <H3 className="mb-4">{t('about.vision.title')}</H3>
                                <P className="text-muted-foreground">
                                    {t('about.vision.description')}
                                </P>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <H3 className="mb-4">{t('about.whyChooseUs.title')}</H3>
                                <ul className="space-y-3">
                                    {whyChooseUs.map((reason, index) => (
                                        <li key={index} className="flex items-start group gap-2">
                                            <CheckCircle className="scale-100 w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{reason}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={valuesAnimation.elementRef}
                        className={`text-center mb-16 transition-all duration-1000 ${valuesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        <H2 className="mb-4">{t('about.values.title')}</H2>
                        <P className="text-muted-foreground max-w-2xl mx-auto">
                            {t('about.values.description')}
                        </P>
                    </div>

                    <div className={`grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 transition-all duration-1000 delay-300 ${valuesAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}>
                        {values.map((value, index) => (
                            <Card key={index} className="text-center h-full hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                                        <value.icon className="w-6 h-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <CardTitle className="text-lg">{value.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <P className="text-muted-foreground text-sm">{value.description}</P>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div
                            ref={founderAnimation.elementRef}
                            className={`text-center mb-16 transition-all duration-1000 ${founderAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                        >
                            <H2 className="mb-4">{t('about.founder.title')}</H2>
                            <P className="text-muted-foreground max-w-2xl mx-auto">
                                {t('about.founder.description')}
                            </P>
                        </div>

                        <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-300 ${founderAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}>
                            <div className="text-center md:text-left">
                                <div className="w-32 h-32 rounded-full bg-orange-100 dark:bg-orange-900/20 mx-auto md:mx-0 mb-6 flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors duration-300 group">
                                    <Users className="w-16 h-16 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <H3 className="text-2xl mb-2">{t('about.founder.name')}</H3>
                                <P className="text-orange-600 dark:text-orange-400 font-medium mb-4">
                                    {t('about.founder.role')}
                                </P>
                            </div>
                            <div>
                                <P className="text-muted-foreground leading-relaxed mb-6">
                                    {t('about.founder.bio')}
                                </P>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <H3 className="text-lg mb-4">{t('about.founder.journey.title')}</H3>
                                    <P className="text-muted-foreground text-sm leading-relaxed">
                                        {t('about.founder.journey.description')}
                                    </P>
                                </div>
                            </div>
                        </div>
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
                        <H2 className="mb-6">{t('about.cta.title')}</H2>
                        <P className="text-muted-foreground mb-8">
                            {t('about.cta.description')}
                        </P>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/get-started">{t('about.cta.secondaryButton')}</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="hover:scale-105 transition-transform duration-300">
                                <Link href="/demo">{t('about.cta.primaryButton')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
