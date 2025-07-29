import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface SubscriptionConfirmationProps {
    userName: string;
    plan: string;
    billingCycle: string;
    amount: number;
    currency: string;
    subscriptionId: string;
    transactionId: number;
    dashboardUrl: string;
    t: Translator["t"];
}

export default function SubscriptionConfirmation({
    userName,
    plan,
    billingCycle,
    amount,
    currency,
    subscriptionId,
    transactionId,
    dashboardUrl,
    t,
}: SubscriptionConfirmationProps) {
    return (
        <>
            {/* Welcome Section */}
            <Section className="mb-6 px-4">
                <Text className="text-2xl font-bold text-center text-primary mb-4">
                    🎉 {t("subscriptionEmails.confirmation.welcome")}
                </Text>
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.confirmation.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.confirmation.thankyoumessage")}
                </Text>
            </Section>

            {/* Subscription Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.confirmation.subscriptiondetails")}
                    </Text>
                    
                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.confirmation.plan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${plan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.confirmation.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.confirmation.amount")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {amount} {currency}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.confirmation.transactionid")}
                            </Text>
                            <Text className="text-base font-mono text-gray-900">
                                #{transactionId}
                            </Text>
                        </Column>
                    </Row>

                    <Row>
                        <Column>
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.confirmation.subscriptionid")}
                            </Text>
                            <Text className="text-sm font-mono text-gray-700">
                                {subscriptionId}
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* What's Next Section */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.confirmation.whatsnext")}
                </Text>
                <div className="space-y-3">
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            1
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.confirmation.step1")}
                        </Text>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            2
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.confirmation.step2")}
                        </Text>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            3
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.confirmation.step3")}
                        </Text>
                    </div>
                </div>
            </Section>

            {/* Call to Action Button */}
            <Section className="text-center mb-8 px-4">
                <Button
                    href={dashboardUrl}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-xl font-bold hover:opacity-90 transition-opacity duration-200 inline-block"
                >
                    {t("subscriptionEmails.confirmation.accessdashboard")}
                </Button>
            </Section>

            {/* Features Highlight */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.confirmation.featuresunlocked")}
                </Text>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((featureIndex) => (
                            <div key={featureIndex} className="flex items-center">
                                <div className="text-orange-600 mr-3">✓</div>
                                <Text className="text-sm text-gray-700">
                                    {t(`plans.${plan}.features.feature${featureIndex}` as any)}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.confirmation.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.confirmation.billingquestions")}
                </Text>
            </Section>
        </>
    );
}
