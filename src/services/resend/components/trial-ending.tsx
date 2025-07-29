import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";
import { PLAN_CONFIGS } from "@/features/plans/config";

interface TrialEndingProps {
    userName: string;
    plan: string;
    trialEndDate: string;
    daysRemaining: number;
    upgradeUrl: string;
    dashboardUrl: string;
    t: Translator["t"];
}

export default function TrialEnding({
    userName,
    plan,
    trialEndDate,
    daysRemaining,
    upgradeUrl,
    dashboardUrl,
    t,
}: TrialEndingProps) {
    const isUrgent = daysRemaining <= 3;
    const urgencyColor = isUrgent ? "red" : "orange";

    return (
        <>
            {/* Urgency Alert */}
            <Section className="mb-6 px-4">
                <div className={`bg-${urgencyColor}-50 border border-${urgencyColor}-200 rounded-lg p-6 text-center`}>
                    <Text className={`text-2xl font-bold text-${urgencyColor}-600 mb-2`}>
                        ⏰ {t("subscriptionEmails.trialEnding.urgencytitle", { days: daysRemaining })}
                    </Text>
                    <Text className={`text-base text-${urgencyColor}-700`}>
                        {isUrgent
                            ? t("subscriptionEmails.trialEnding.urgentmessage")
                            : t("subscriptionEmails.trialEnding.remindermessage")
                        }
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.trialEnding.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.trialEnding.trialendingmessage", {
                        plan: t(`plans.${plan}.name` as any),
                        days: daysRemaining
                    })}
                </Text>
            </Section>

            {/* Trial Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.trialEnding.trialdetails")}
                    </Text>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.trialEnding.currentplan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${plan}.name` as any)} {t("subscriptionEmails.trialEnding.trial")}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.trialEnding.daysremaining")}
                            </Text>
                            <Text className={`text-2xl font-bold text-${urgencyColor}-600`}>
                                {daysRemaining}
                            </Text>
                        </Column>
                    </Row>

                    <Row>
                        <Column>
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.trialEnding.trialends")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {new Date(trialEndDate).toLocaleDateString()}
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* What You've Accomplished */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.trialEnding.yourprogress")}
                </Text>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <Text className="text-base text-gray-700 mb-4">
                        {t("subscriptionEmails.trialEnding.progressmessage")}
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <Text className="text-2xl font-bold text-green-600 mb-1">
                                {t("subscriptionEmails.trialEnding.studentscreated")}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                {t("subscriptionEmails.trialEnding.students")}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-2xl font-bold text-green-600 mb-1">
                                {t("subscriptionEmails.trialEnding.coursescreated")}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                {t("subscriptionEmails.trialEnding.courses")}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-2xl font-bold text-green-600 mb-1">
                                {t("subscriptionEmails.trialEnding.hourssaved")}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                {t("subscriptionEmails.trialEnding.timesaved")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* What Happens After Trial */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.trialEnding.aftertrial")}
                </Text>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            ✗
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.trialEnding.loseaccesstitle")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.trialEnding.loseaccessdesc")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            ⚠
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.trialEnding.limitedaccesstitle")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.trialEnding.limitedaccessdesc")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            ✓
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.trialEnding.datasafetitle")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.trialEnding.datasafedesc")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Pricing Options */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.trialEnding.continuejourney")}
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Option */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                            {t("subscriptionEmails.trialEnding.monthlyplan")}
                        </Text>
                        <Text className="text-3xl font-bold text-primary mb-2">
                            {t(`plans.${plan}.pricing.monthly` as any)} {t("pricing.currency")}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-4">
                            {t("subscriptionEmails.trialEnding.permonth")}
                        </Text>
                        <div className="space-y-2">
                            {[1, 2, 3].map((featureIndex) => (
                                <div key={featureIndex} className="flex items-center">
                                    <div className="text-green-500 mr-2">✓</div>
                                    <Text className="text-sm text-gray-700">
                                        {t(`plans.${plan}.features.feature${featureIndex}` as any)}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Yearly Option */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6 relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                {t("subscriptionEmails.trialEnding.bestvalue")}
                            </div>
                        </div>
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                            {t("subscriptionEmails.trialEnding.yearlyplan")}
                        </Text>
                        <div className="flex items-baseline mb-2">
                            <Text className="text-3xl font-bold text-primary">
                                {t(`plans.${plan}.pricing.yearly` as any)} {t("pricing.currency")}
                            </Text>
                            <Text className="text-sm text-gray-500 ml-2 line-through">
                                {PLAN_CONFIGS[plan as "free" | "enterprise" | "basic" | "professional"].pricing.monthly * 12} {t("pricing.currency")}
                            </Text>
                        </div>
                        <Text className="text-sm text-green-600 font-semibold mb-4">
                            {t("subscriptionEmails.trialEnding.saveannually")}
                        </Text>
                        <div className="space-y-2">
                            {[1, 2, 3].map((featureIndex) => (
                                <div key={featureIndex} className="flex items-center">
                                    <div className="text-green-500 mr-2">✓</div>
                                    <Text className="text-sm text-gray-700">
                                        {t(`plans.${plan}.features.feature${featureIndex}` as any)}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    <Button
                        href={upgradeUrl}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-xl font-bold hover:opacity-90 transition-opacity duration-200 inline-block w-full max-w-sm"
                    >
                        {t("subscriptionEmails.trialEnding.continuesubscription")}
                    </Button>
                    <div>
                        <Button
                            href={dashboardUrl}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.trialEnding.viewdashboard")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Testimonial */}
            <Section className="mb-8 px-4">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <Text className="text-base italic text-gray-700 mb-4">
                        "{t("subscriptionEmails.trialEnding.testimonialtext")}"
                    </Text>
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                        <div>
                            <Text className="text-sm font-semibold text-gray-900">
                                {t("subscriptionEmails.trialEnding.testimonialauthor")}
                            </Text>
                            <Text className="text-xs text-gray-600">
                                {t("subscriptionEmails.trialEnding.testimonialtitle")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.trialEnding.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.trialEnding.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
