'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { H1, H2, H3, P, Lead, Muted, Small } from '@/components/ui/typography';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle, HomeIcon, LayoutDashboardIcon } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SYSTEM_FEATURES } from '@/constants';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import WrapWithTooltip from '@/components/general/wrap-with-tooltip';
import { getStartedFormSchema, type GetStartedFormData } from '@/featurs/get-started/schema';
import { api } from '@/trpc/react';

const TOTAL_STEPS = 3;

function FeaturesSelection({ field, t }: { field: any; t: any }) {
    const freeFeatures = useMemo(() => SYSTEM_FEATURES.filter(f => f.isFree), []);
    const premiumFeatures = useMemo(() => SYSTEM_FEATURES.filter(f => !f.isFree), []);

    const handleChange = useCallback(
        (key: string) => {
            const newFeatures = field.value?.includes(key)
                ? field.value.filter((f: string) => f !== key)
                : [...(field.value || []), key];
            field.onChange(newFeatures);
        },
        [field]
    );

    return (
        <>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
                {freeFeatures.map((feature) => (
                    <FormControl key={feature.key}>
                        <Label htmlFor={feature.key} className="flex items-center justify-between gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                            <div className='flex items-center gap-2'>
                                <Checkbox
                                    id={feature.key}
                                    checked={field.value?.includes(feature.key)}
                                    onCheckedChange={() => handleChange(feature.key)}
                                />
                                <Small className="text-sm">{t(`getStartedForm.featureLabels.${feature.key}`)}</Small>
                            </div>
                        </Label>
                    </FormControl>
                ))}
            </div>
            {premiumFeatures.length > 0 && <Separator className="my-2" />}
            <div className="grid md:grid-cols-2 gap-3">
                {premiumFeatures.map((feature) => (
                    <FormControl key={feature.key}>
                        <Label htmlFor={feature.key} className="flex items-center justify-between gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                            <div className='flex items-center gap-2'>
                                <Checkbox
                                    id={feature.key}
                                    checked={field.value?.includes(feature.key)}
                                    onCheckedChange={() => handleChange(feature.key)}
                                />
                                <Small className="text-sm">{t(`getStartedForm.featureLabels.${feature.key}`)}</Small>
                            </div>
                            <WrapWithTooltip text={t("getStartedForm.premuim.description")}>
                                <Badge>{t("premium")}</Badge>
                            </WrapWithTooltip>
                        </Label>
                    </FormControl>
                ))}
            </div>
        </>
    );
}

function ReviewSection({ form, t }: { form: any; t: any }) {
    const features = form.watch('features');
    const additionalNotes = form.watch('additionalNotes');
    return (
        <div className="bg-secondary rounded-lg p-6">
            <H3 className="mb-4">{t('getStartedForm.step3.reviewTitle')}</H3>
            <div className="space-y-3 text-sm">
                <div>
                    <strong>{t('getStartedForm.step3.contactInfo')}:</strong> {form.watch('contactName')} ({form.watch('email')})
                </div>
                <div>
                    <strong>{t('getStartedForm.step3.businessInfo')}:</strong> {form.watch('businessName')}
                </div>
                {features?.length > 0 && (
                    <div className='flex items-center gap-2'>
                        <strong>{t('getStartedForm.step3.featuresInfo')}:</strong>
                        {features.map((f: string, i: number) =>
                            <Muted
                                key={f + i}
                                className={!SYSTEM_FEATURES.find(feature => feature.key === f)?.isFree ? "text-primary" : ""}>
                                {t(`getStartedForm.featureLabels.${f}`)}{(i !== (features.length - 1)) ? "," : "."}
                            </Muted>
                        )}
                    </div>
                )}
                {additionalNotes && (
                    <div>
                        <strong>{t('getStartedForm.step1.additionalNotesLabel')}:</strong> {additionalNotes}
                    </div>
                )}
            </div>
        </div>
    );
}

function WhatHappensNext({ t }: { t: any }) {
    return (
        <div className="bg-accent/50 border border-accent rounded-lg p-6">
            <H3 className="mb-3">{t('getStartedForm.step3.whatHappensNextTitle')}</H3>
            <div className="space-y-2 text-sm">
                {[1, 2, 3].map((step) => (
                    <div className="flex items-center gap-2" key={step}>
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <Small>{t(`getStartedForm.step3.nextStep${step}`)}</Small>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PremiumNotice({ form, t }: { form: any; t: any }) {
    const hasPremium = useMemo(
        () =>
            form.watch("features").some((feature: string) =>
                SYSTEM_FEATURES.find(f => f.key === feature && !f.isFree)
            ),
        [form]
    );
    if (!hasPremium) return null;
    return (
        <div className="flex flex-col gap-2 items-start bg-success/10 border border-success/50 rounded-lg p-6">
            <H3 className="mb-3">{t('getStartedForm.premuim.some')}</H3>
            <Small>{t('getStartedForm.premuim.description')}</Small>
            <Button asChild>
                <Link href="/pricing" target="_blank" rel="noopener noreferrer">
                    {t('getStartedForm.premuim.prices')}
                </Link>
            </Button>
        </div>
    );
}

export function GetStartedForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const { t } = useTranslation();

    const form = useForm<GetStartedFormData>({
        resolver: zodResolver(getStartedFormSchema),
        defaultValues: {
            contactName: "",
            businessName: "",
            email: "",
            features: [],
            additionalNotes: "",
            currentWebsiteUrl: "",
            phone: "",
        },
    });

    const nextStep = useCallback(async () => {
        const isValid = await form.trigger(["contactName", "businessName", "email", "phone"]);
        if (isValid && currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    }, [form, currentStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }
    }, [currentStep]);

    const getStepTitle = useCallback((step: number) => {
        switch (step) {
            case 1: return t('getStartedForm.stepTitles.businessInfo');
            case 2: return t('getStartedForm.stepTitles.features');
            case 3: return t('getStartedForm.stepTitles.reviewSubmit');
            default: return '';
        }
    }, [t]);

    const getStartedMutation = api.getStartedRouter.init.useMutation();

    const onSubmit = useCallback(async (data: GetStartedFormData) => {
        getStartedMutation.mutate(data);
    }, []);

    // Success state (replace with actual success logic)
    if (getStartedMutation.isSuccess) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
                    <Card className="border-green-200 dark:border-green-800">
                        <CardContent className="p-8">
                            <div className="mb-6">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 scale-none" />
                                <H2 className="text-green-700 dark:text-green-400 mb-4">{t('getStartedForm.success.thankYouTitle', { name: form.getValues().contactName })}</H2>
                                <P className="text-muted-foreground mb-6">
                                    {t('getStartedForm.success.confirmationMessage')}
                                </P>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                                <H3 className="mb-4">{t('getStartedForm.success.whatHappensNextTitle')}</H3>
                                <div className="space-y-3 text-left">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-background rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <P className="text-sm">{t('getStartedForm.success.step1')}</P>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-background rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <P className="text-sm">{t('getStartedForm.success.step2')}</P>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-background rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <P className="text-sm">{t('getStartedForm.success.step3')}</P>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-background rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                        <P className="text-sm">{t('getStartedForm.success.step4')}</P>
                                    </div>
                                </div>
                            </div>
                            <div className='flex items-center justify-center gap-4'>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/'}
                                >
                                    <HomeIcon />
                                    {t('getStartedForm.success.returnToHomepage')}
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="default"
                                >
                                    <LayoutDashboardIcon />
                                    {t('getStartedForm.success.goToDashboard')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <H1 className="mb-4">{t('getStartedForm.hero.title')}</H1>
                    <Lead className="text-muted-foreground max-w-2xl mx-auto">
                        {t('getStartedForm.hero.description')}
                    </Lead>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <H3>{getStepTitle(currentStep)}</H3>
                        <Muted>{t('getStartedForm.progress.stepOfTotal', { currentStep, totalSteps: TOTAL_STEPS })}</Muted>
                    </div>
                    <Progress value={(currentStep / TOTAL_STEPS) * 100} />
                </div>

                {/* Error Alert */}
                {getStartedMutation.isError && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{getStartedMutation.error.message || t("error", { error: "" })}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('getStartedForm.cardTitle', { currentStep, stepTitle: getStepTitle(currentStep) })}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Business Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="contactName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('getStartedForm.step1.contactNameLabel')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder={t('getStartedForm.step1.contactNamePlaceholder')} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="businessName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('getStartedForm.step1.businessNameLabel')}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder={t('getStartedForm.step1.businessNamePlaceholder')} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('getStartedForm.step1.emailLabel')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder={t('getStartedForm.step1.emailPlaceholder')} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('getStartedForm.step1.phoneLabel')}</FormLabel>
                                                        <FormControl>
                                                            <Input type="tel" placeholder={t('getStartedForm.step1.phonePlaceholder')} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="currentWebsiteUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('getStartedForm.step1.currentWebsiteLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input type="url" placeholder={t('getStartedForm.step1.currentWebsitePlaceholder')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="additionalNotes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel htmlFor="additionalNotes">{t('getStartedForm.step1.additionalNotesLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            id="additionalNotes"
                                                            placeholder={t('getStartedForm.step1.additionalNotesPlaceholder')}
                                                            rows={4}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Step 2: Features */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="features"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-base font-medium">{t('getStartedForm.step2.featuresQuestion')}</FormLabel>
                                                    <FeaturesSelection field={field} t={t} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Step 3: Review & Submit */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <ReviewSection form={form} t={t} />
                                        <WhatHappensNext t={t} />
                                        <PremiumNotice form={form} t={t} />
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={currentStep === 1 || form.formState.isSubmitting}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        {t('getStartedForm.navigation.previous')}
                                    </Button>

                                    {currentStep < TOTAL_STEPS ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={form.formState.isSubmitting}
                                            className="flex items-center gap-2 bg-primary"
                                        >
                                            {t('getStartedForm.navigation.next')}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting}
                                            className="flex items-center gap-2 bg-primary"
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin scale-none" />
                                                    {t('getStartedForm.navigation.preparingYourSystem')}
                                                </>
                                            ) : (
                                                <>
                                                    {t('getStartedForm.navigation.letsGo')}
                                                    <CheckCircle className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
