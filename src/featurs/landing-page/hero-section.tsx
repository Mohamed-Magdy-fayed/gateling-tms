'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { H1, Lead, P } from '@/components/ui/typography';
import { useTranslation } from '@/i18n/useTranslation';
import { useMemo } from 'react';

export function HeroSection() {
    const { t, locale } = useTranslation();

    const trustIndicators = useMemo(() => [
        t('hero.trustIndicators.activeAcademies'),
        t('hero.trustIndicators.clientSatisfaction'),
        t('hero.trustIndicators.support'),
    ], [locale]);

    const benefits = useMemo(() => [
        t('hero.benefits.benefit1'),
        t('hero.benefits.benefit2'),
        t('hero.benefits.benefit3'),
        t('hero.benefits.benefit4'),
    ], [locale]);

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-background to-accent/20 py-20 sm:py-32">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left column - Content */}
                    <div className="space-y-8">
                        {/* Trust indicators */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {trustIndicators.map((indicator, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span>{indicator}</span>
                                </div>
                            ))}
                        </div>

                        {/* Main headline */}
                        <div className="space-y-4">
                            <H1 className="text-primary">
                                {t('hero.mainHeadline.part1')}
                                <span className="block">{t('hero.mainHeadline.part2')}</span>
                            </H1>
                            <Lead className="text-foreground/80 max-w-xl">
                                {t('hero.leadText')}
                            </Lead>
                        </div>

                        {/* Benefits list */}
                        <div className='space-y-2'>
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                                    <P className="text-foreground/80">{benefit}</P>
                                </div>
                            ))}
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button asChild size="lg" className="text-lg px-8">
                                <Link href="/get-started">
                                    {t('hero.cta.getstarted')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild className="text-lg px-8">
                                <Link href="/pricing">
                                    {t('hero.cta.priceing')}
                                </Link>
                            </Button>
                        </div>

                        {/* Social proof */}
                        <div className="pt-8 border-t border-border/50">
                            <P className="text-sm text-muted-foreground mb-4">
                                {t('hero.socialProof')}
                            </P>
                            <div className="flex items-center gap-6 opacity-60">
                                {/* Placeholder for client logos */}
                                <div className="h-8 w-20 bg-muted rounded" />
                                <div className="h-8 w-20 bg-muted rounded" />
                                <div className="h-8 w-20 bg-muted rounded" />
                                <div className="h-8 w-20 bg-muted rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Right column - Visual */}
                    <div className="relative">
                        {/* Hero image placeholder */}
                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 shadow-2xl">
                            <div className="aspect-[4/3] bg-background rounded-lg shadow-lg border border-border/50 p-6">
                                {/* Mock website preview */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 bg-primary/20 rounded w-3/4" />
                                        <div className="h-3 bg-muted rounded w-full" />
                                        <div className="h-3 bg-muted rounded w-5/6" />
                                        <div className="h-8 bg-primary rounded w-1/3 mt-4" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-6">
                                        <div className="h-16 bg-muted rounded" />
                                        <div className="h-16 bg-muted rounded" />
                                        <div className="h-16 bg-muted rounded" />
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-background border border-border rounded-lg p-3 shadow-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium">{t('hero.liveIndicator')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
