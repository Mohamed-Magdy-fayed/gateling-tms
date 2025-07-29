"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { H1, H2, H3, P, Lead } from '@/components/ui/typography';
import {
    Check,
    Crown,
    Zap,
    Users,
    BarChart3,
    Shield,
    Loader2,
    CreditCard,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { useScrollAnimation } from '@/hooks/use-animation';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
type BillingCycle = 'monthly' | 'yearly';

interface BillingData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        apartment?: string;
        floor?: string;
        building?: string;
    };
}

export default function PlansClient() {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const router = useRouter();

    // State management
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentIframeUrl, setPaymentIframeUrl] = useState<string | null>(null);

    // Billing form data
    const [billingData, setBillingData] = useState<BillingData>({
        firstName: '',
        lastName: '',
        email: session?.user?.email || '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: 'Egypt',
            postalCode: '',
            apartment: '',
            floor: '',
            building: '',
        },
    });

    // API queries and mutations
    const { data: plans, isLoading: plansLoading } = api.subscription.getPlans.useQuery();
    const { data: currentSubscription } = api.subscription.getCurrent.useQuery();
    const { data: usageData } = api.subscription.getUsage.useQuery(
        { subscriptionId: currentSubscription?.id || '' },
        { enabled: !!currentSubscription }
    );

    const createSubscriptionMutation = api.subscription.create.useMutation();
    const createPaymentIntentMutation = api.subscription.createPaymentIntent.useMutation();
    const updateSubscriptionMutation = api.subscription.update.useMutation();
    const cancelSubscriptionMutation = api.subscription.cancel.useMutation();

    // Handle plan selection
    const handlePlanSelect = async (plan: SubscriptionPlan) => {
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        setSelectedPlan(plan);

        // For free plan, create subscription directly
        if (plan === 'free') {
            try {
                setIsProcessing(true);
                await createSubscriptionMutation.mutateAsync({
                    plan,
                    billingCycle,
                });

                toast.success(t('pricing.success.freeSubscription'));
                router.push('/dashboard');
            } catch (error) {
                toast.error(t('pricing.errors.subscriptionFailed'));
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // For paid plans, show billing modal
        setShowBillingModal(true);
    };

    // Handle billing form submission
    const handleBillingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPlan) return;

        try {
            setIsProcessing(true);

            // First create the subscription
            const subscription = await createSubscriptionMutation.mutateAsync({
                plan: selectedPlan,
                billingCycle,
            });

            // Then create payment intent
            const paymentResult = await createPaymentIntentMutation.mutateAsync({
                subscriptionId: subscription.id,
                returnUrl: `${window.location.origin}/pricing/success`,
            });

            if (paymentResult.paymentUrl) {
                setPaymentIframeUrl(paymentResult.paymentUrl);
                setShowBillingModal(false);
                setShowPaymentModal(true);
            } else {
                toast.error(t('pricing.errors.paymentIntentFailed'));
            }
        } catch (error) {
            toast.error(t('pricing.errors.paymentIntentFailed'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle plan change
    const handlePlanChange = async (newPlan: SubscriptionPlan) => {
        if (!currentSubscription) return;

        try {
            setIsProcessing(true);
            setSelectedPlan(newPlan);

            if (newPlan === 'free') {
                // Downgrade to free
                await cancelSubscriptionMutation.mutateAsync({
                    subscriptionId: currentSubscription.id,
                    immediately: false,
                });
                toast.success(t('pricing.success.planDowngraded'));
            } else {
                // Upgrade or change plan - show billing modal
                await updateSubscriptionMutation.mutateAsync({
                    subscriptionId: currentSubscription.id,
                    plan: newPlan,
                    billingCycle,
                });
                setShowBillingModal(true);
            }
        } catch (error) {
            toast.error(t('pricing.errors.planChangeFailed'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate savings for yearly billing
    const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
        const monthlyCost = monthlyPrice * 12;
        const savings = monthlyCost - yearlyPrice;
        const percentage = Math.round((savings / monthlyCost) * 100);
        return { savings, percentage };
    };

    // Get plan status for current user
    const getPlanStatus = (planId: SubscriptionPlan) => {
        if (!currentSubscription) return 'available';
        if (currentSubscription.plan === planId) return 'current';
        return 'available';
    };

    const heroAnimation = useScrollAnimation(plansLoading);
    const plansAnimation = useScrollAnimation(plansLoading);
    const faqAnimation = useScrollAnimation(plansLoading);

    if (plansLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-stone-900 dark:to-stone-800">
                <div
                    ref={heroAnimation.elementRef}
                    className={`container mx-auto px-4 text-center transition-all duration-1000 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                        }`}
                >
                    <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        {t('pricing.hero.badge')}
                    </Badge>
                    <H1 className="mb-6 max-w-4xl mx-auto">
                        {t('pricing.hero.title')}
                    </H1>
                    <Lead className="mb-8 max-w-2xl mx-auto text-muted-foreground">
                        {t('pricing.hero.description')}
                    </Lead>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : ''}>
                            {t('pricing.billing.monthly')}
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={billingCycle === 'yearly'}
                            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        />
                        <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : ''}>
                            {t('pricing.billing.yearly')}
                        </Label>
                        {billingCycle === 'yearly' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                {t('pricing.billing.savePercent', { percent: 17 })}
                            </Badge>
                        )}
                    </div>
                </div>
            </section>

            {/* Pricing Plans */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div
                        ref={plansAnimation.elementRef}
                        className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 ${plansAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        {plans?.map((plan, index) => {
                            const price = billingCycle === 'yearly' ? parseFloat(plan.yearlyPrice) : parseFloat(plan.monthlyPrice);
                            const monthlyPrice = parseFloat(plan.monthlyPrice);
                            const yearlyPrice = parseFloat(plan.yearlyPrice);
                            const savings = billingCycle === 'yearly' && monthlyPrice > 0 ?
                                calculateSavings(monthlyPrice, yearlyPrice) : null;
                            const planStatus = getPlanStatus(plan.plan);

                            return (
                                <Card
                                    key={plan.id}
                                    className={`relative hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ${plan.isPopular ? 'border-orange-200 shadow-lg scale-105' : ''
                                        } ${planStatus === 'current' ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : ''}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge className="bg-orange-500 text-white">
                                                <Crown className="w-3 h-3 mr-1" />
                                                {t('pricing.mostPopular')}
                                            </Badge>
                                        </div>
                                    )}

                                    {planStatus === 'current' && (
                                        <div className="absolute -top-3 right-4">
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                {t('pricing.status.current')}
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center mx-auto mb-4">
                                            {plan.plan === 'free' && <Zap className="w-8 h-8 text-orange-600" />}
                                            {plan.plan === 'basic' && <Users className="w-8 h-8 text-orange-600" />}
                                            {plan.plan === 'professional' && <BarChart3 className="w-8 h-8 text-orange-600" />}
                                            {plan.plan === 'enterprise' && <Shield className="w-8 h-8 text-orange-600" />}
                                        </div>
                                        <CardTitle className="text-2xl">{t(`pricing.plans.${plan.plan}.name`)}</CardTitle>
                                        <CardDescription className="text-sm">{t(`pricing.plans.${plan.plan}.description`)}</CardDescription>

                                        <div className="mt-4">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-3xl font-bold">
                                                    {price === 0 ? t('pricing.free') : `${price} ${t('pricing.currency')}`}
                                                </span>
                                                {price > 0 && (
                                                    <span className="text-muted-foreground">
                                                        /{billingCycle === 'yearly' ? t('pricing.year') : t('pricing.month')}
                                                    </span>
                                                )}
                                            </div>

                                            {savings && (
                                                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                    {t('pricing.billing.save', { amount: savings.savings, currency: t('pricing.currency') })}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Features List */}
                                        <div className="space-y-2">
                                            {plan.features.map((featureKey, featureIndex) => (
                                                <div key={featureIndex} className="flex items-center gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    <span>{t(`pricing.features.${featureKey}`)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Limits Display */}
                                        <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>{t('pricing.limits.students')}</span>
                                                <span>{plan.maxStudents === 999999 ? t('pricing.unlimited') : plan.maxStudents.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t('pricing.limits.courses')}</span>
                                                <span>{plan.maxCourses === 999999 ? t('pricing.unlimited') : plan.maxCourses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t('pricing.limits.storage')}</span>
                                                <span>{plan.maxStorageGB === 500 ? t('pricing.unlimited') : `${plan.maxStorageGB} GB`}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            className={`w-full mt-6 ${plan.isPopular ? 'bg-orange-500 hover:bg-orange-600' : ''
                                                }`}
                                            variant={plan.isPopular ? 'default' : 'outline'}
                                            onClick={() => planStatus === 'current' ? null : handlePlanSelect(plan.plan)}
                                            disabled={isProcessing || planStatus === 'current'}
                                        >
                                            {isProcessing && selectedPlan === plan.plan ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : null}
                                            {planStatus === 'current'
                                                ? t('pricing.buttons.current')
                                                : plan.plan === 'free'
                                                    ? t('pricing.buttons.getStarted')
                                                    : currentSubscription
                                                        ? t('pricing.buttons.changePlan')
                                                        : t('pricing.buttons.subscribe')
                                            }
                                        </Button>

                                        {plan.plan === 'enterprise' && (
                                            <p className="text-xs text-center text-muted-foreground mt-2">
                                                {t('pricing.enterprise.contact')}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Current Usage Display */}
            {currentSubscription && usageData && (
                <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
                    <div className="container mx-auto px-4">
                        <Card className="max-w-4xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    {t('pricing.usage.title')}
                                </CardTitle>
                                <CardDescription>{t('pricing.usage.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {usageData.usage?.currentStudents || 0}
                                            {usageData.subscription?.maxStudents !== 999999 && ` / ${usageData.subscription?.maxStudents.toLocaleString()}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('pricing.usage.students')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {usageData.usage?.currentCourses || 0}
                                            {usageData.subscription?.maxCourses !== 999999 && ` / ${usageData.subscription?.maxCourses.toLocaleString()}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('pricing.usage.courses')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {((parseFloat(usageData.usage?.currentStorageGB || '0')) / 1024).toFixed(1)} GB
                                            {usageData.subscription?.maxStorageGB !== 500 && ` / ${usageData.subscription?.maxStorageGB} GB`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('pricing.usage.storage')}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {/* FAQ Section */}
            <section className="py-20">
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
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        {t(`pricing.faq.questions.q${faqIndex}.question` as any)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <P className="text-muted-foreground">{t(`pricing.faq.questions.q${faqIndex}.answer` as any)}</P>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Billing Information Modal */}
            <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('pricing.billing.title')}</DialogTitle>
                        <DialogDescription>{t('pricing.billing.description')}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBillingSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">{t('pricing.billing.firstName')}</Label>
                                <Input
                                    id="firstName"
                                    value={billingData.firstName}
                                    onChange={(e) => setBillingData(prev => ({ ...prev, firstName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">{t('pricing.billing.lastName')}</Label>
                                <Input
                                    id="lastName"
                                    value={billingData.lastName}
                                    onChange={(e) => setBillingData(prev => ({ ...prev, lastName: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('pricing.billing.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={billingData.email}
                                    onChange={(e) => setBillingData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('pricing.billing.phone')}</Label>
                                <Input
                                    id="phone"
                                    value={billingData.phone}
                                    onChange={(e) => setBillingData(prev => ({ ...prev, phone: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <H3>{t('pricing.billing.address')}</H3>
                            <div className="space-y-2">
                                <Label htmlFor="street">{t('pricing.billing.street')}</Label>
                                <Input
                                    id="street"
                                    value={billingData.address.street}
                                    onChange={(e) => setBillingData(prev => ({
                                        ...prev,
                                        address: { ...prev.address, street: e.target.value }
                                    }))}
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">{t('pricing.billing.city')}</Label>
                                    <Input
                                        id="city"
                                        value={billingData.address.city}
                                        onChange={(e) => setBillingData(prev => ({
                                            ...prev,
                                            address: { ...prev.address, city: e.target.value }
                                        }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">{t('pricing.billing.state')}</Label>
                                    <Input
                                        id="state"
                                        value={billingData.address.state}
                                        onChange={(e) => setBillingData(prev => ({
                                            ...prev,
                                            address: { ...prev.address, state: e.target.value }
                                        }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">{t('pricing.billing.postalCode')}</Label>
                                    <Input
                                        id="postalCode"
                                        value={billingData.address.postalCode}
                                        onChange={(e) => setBillingData(prev => ({
                                            ...prev,
                                            address: { ...prev.address, postalCode: e.target.value }
                                        }))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => setShowBillingModal(false)}>
                                {t('pricing.billing.cancel')}
                            </Button>
                            <Button type="submit" disabled={isProcessing} className="flex-1">
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                {t('pricing.billing.proceedToPayment')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="min-w-7xl">
                    <DialogHeader>
                        <DialogTitle>{t('pricing.payment.title')}</DialogTitle>
                        <DialogDescription>{t('pricing.payment.description')}</DialogDescription>
                    </DialogHeader>

                    {paymentIframeUrl && (
                        <iframe
                            src={paymentIframeUrl}
                            className="min-w-6xl h-[500px]"
                            title="Payment"
                            onLoad={() => {
                                // Listen for payment completion messages from Paymob
                                // Payment completion will be handled by webhook
                                // User will be redirected to success page
                            }}
                        />
                    )}

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {t('pricing.payment.secureNotice')}
                        </AlertDescription>
                    </Alert>
                </DialogContent>
            </Dialog>
        </div>
    );
}
