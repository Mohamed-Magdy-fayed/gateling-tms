import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface SubscriptionCancelledProps {
    userName: string;
    plan: string;
    billingCycle: string;
    cancellationDate: string;
    effectiveDate: string;
    immediately: boolean;
    reactivateUrl: string;
    feedbackUrl: string;
    t: Translator["t"];
}

export default function SubscriptionCancelled({
    userName,
    plan,
    billingCycle,
    cancellationDate,
    effectiveDate,
    immediately,
    reactivateUrl,
    feedbackUrl,
    t,
}: SubscriptionCancelledProps) {
    return (
        <>
            {/* Cancellation Notice */}
            <Section className="mb-6 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <Text className="text-2xl font-bold text-red-600 mb-2">
                        😔 {t("subscriptionEmails.cancelled.noticetitle")}
                    </Text>
                    <Text className="text-base text-red-700">
                        {immediately
                            ? t("subscriptionEmails.cancelled.immediatenotice")
                            : t("subscriptionEmails.cancelled.endperiodnotice")
                        }
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.cancelled.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.cancelled.cancellationmessage", {
                        plan: t(`plans.${plan}.name` as any)
                    })}
                </Text>
            </Section>

            {/* Cancellation Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.cancelled.cancellationdetails")}
                    </Text>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.cancelled.cancelledplan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${plan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.cancelled.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.cancelled.cancellationdate")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {new Date(cancellationDate).toLocaleDateString()}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.cancelled.accessuntil")}
                            </Text>
                            <Text className="text-base font-semibold text-red-600">
                                {immediately
                                    ? t("subscriptionEmails.cancelled.immediate")
                                    : new Date(effectiveDate).toLocaleDateString()
                                }
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* What Happens Next */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.cancelled.whathappensnext")}
                </Text>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            1
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {immediately
                                    ? t("subscriptionEmails.cancelled.step1immediate")
                                    : t("subscriptionEmails.cancelled.step1periodend")
                                }
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {immediately
                                    ? t("subscriptionEmails.cancelled.step1immediatedesc")
                                    : t("subscriptionEmails.cancelled.step1periodenddesc", {
                                        date: new Date(effectiveDate).toLocaleDateString()
                                    })
                                }
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            2
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.cancelled.step2title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.cancelled.step2desc")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            3
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.cancelled.step3title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.cancelled.step3desc")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Data Backup Reminder */}
            <Section className="mb-8 px-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <Text className="text-base font-semibold text-yellow-700 mb-2">
                        📋 {t("subscriptionEmails.cancelled.backupremindertitle")}
                    </Text>
                    <Text className="text-sm text-yellow-700 mb-3">
                        {t("subscriptionEmails.cancelled.backupremindermessage")}
                    </Text>
                    <div className="space-y-2">
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.cancelled.backupitem1")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.cancelled.backupitem2")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.cancelled.backupitem3")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* We'd Love You Back */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.cancelled.comebacktitle")}
                </Text>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <Text className="text-base text-gray-700 mb-4">
                        {t("subscriptionEmails.cancelled.comebackmessage")}
                    </Text>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">💡</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.cancelled.benefit1")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">🔄</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.cancelled.benefit2")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">🎯</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.cancelled.benefit3")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    {!immediately && (
                        <Button
                            href={reactivateUrl}
                            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity duration-200 inline-block w-full max-w-sm"
                        >
                            {t("subscriptionEmails.cancelled.reactivatesubscription")}
                        </Button>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            href={reactivateUrl}
                            className={`${immediately ? 'bg-primary text-primary-foreground' : 'bg-orange-500 text-white'} px-6 py-3 rounded-lg text-base font-medium hover:opacity-90 transition-opacity duration-200 inline-block`}
                        >
                            {immediately
                                ? t("subscriptionEmails.cancelled.subscribeagain")
                                : t("subscriptionEmails.cancelled.browseplans")
                            }
                        </Button>
                        <Button
                            href={feedbackUrl}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.cancelled.sharefeedback")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Feedback Request */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.cancelled.feedbacktitle")}
                </Text>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <Text className="text-base text-gray-700 mb-4">
                        {t("subscriptionEmails.cancelled.feedbackmessage")}
                    </Text>
                    <Text className="text-sm text-gray-600">
                        {t("subscriptionEmails.cancelled.feedbackquestions")}
                    </Text>
                </div>
            </Section>

            {/* Final Message */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.cancelled.finalmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.cancelled.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
