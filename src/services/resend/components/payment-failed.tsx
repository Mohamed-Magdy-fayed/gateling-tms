import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface PaymentFailedProps {
    userName: string;
    plan: string;
    billingCycle: string;
    amount: number;
    currency: string;
    failureReason?: string;
    retryUrl: string;
    supportUrl: string;
    t: Translator["t"];
}

export default function PaymentFailed({
    userName,
    plan,
    billingCycle,
    amount,
    currency,
    failureReason,
    retryUrl,
    supportUrl,
    t,
}: PaymentFailedProps) {
    return (
        <>
            {/* Alert Section */}
            <Section className="mb-6 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <Text className="text-2xl font-bold text-red-600 mb-2">
                        ⚠️ {t("subscriptionEmails.paymentFailed.alerttitle")}
                    </Text>
                    <Text className="text-base text-red-700">
                        {t("subscriptionEmails.paymentFailed.alertmessage")}
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.paymentFailed.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.paymentFailed.paymentissuemessage")}
                </Text>
            </Section>

            {/* Payment Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.paymentFailed.attemptedpayment")}
                    </Text>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.paymentFailed.plan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${plan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.paymentFailed.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.paymentFailed.amount")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {amount} {currency}
                            </Text>
                        </Column>
                        {failureReason && (
                            <Column className="w-1/2">
                                <Text className="text-sm font-medium text-gray-600 mb-1">
                                    {t("subscriptionEmails.paymentFailed.reason")}
                                </Text>
                                <Text className="text-base text-red-600">
                                    {failureReason}
                                </Text>
                            </Column>
                        )}
                    </Row>
                </div>
            </Section>

            {/* What to Do Next */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.paymentFailed.whattodo")}
                </Text>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            1
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.paymentFailed.step1title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.step1description")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            2
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.paymentFailed.step2title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.step2description")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            3
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.paymentFailed.step3title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.step3description")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    <Button
                        href={retryUrl}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity duration-200 inline-block w-full max-w-sm"
                    >
                        {t("subscriptionEmails.paymentFailed.retrypayment")}
                    </Button>
                    <div>
                        <Button
                            href={supportUrl}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.paymentFailed.contactsupport")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Common Payment Issues */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.paymentFailed.commonissues")}
                </Text>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.issue1")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.issue2")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.issue3")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.paymentFailed.issue4")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Urgency Note */}
            <Section className="mb-6 px-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <Text className="text-sm font-medium text-yellow-800 mb-1">
                        {t("subscriptionEmails.paymentFailed.urgencytitle")}
                    </Text>
                    <Text className="text-sm text-yellow-700">
                        {t("subscriptionEmails.paymentFailed.urgencymessage")}
                    </Text>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.paymentFailed.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.paymentFailed.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
