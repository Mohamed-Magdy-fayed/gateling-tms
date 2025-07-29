import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface PlanUpgradedProps {
    userName: string;
    previousPlan: string;
    newPlan: string;
    billingCycle: string;
    amount: number;
    currency: string;
    effectiveDate: string;
    dashboardUrl: string;
    featuresUrl: string;
    t: Translator["t"];
}

export default function PlanUpgraded({
    userName,
    previousPlan,
    newPlan,
    billingCycle,
    amount,
    currency,
    effectiveDate,
    dashboardUrl,
    featuresUrl,
    t,
}: PlanUpgradedProps) {
    return (
        <>
            {/* Celebration Section */}
            <Section className="mb-6 px-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6 text-center">
                    <Text className="text-2xl font-bold text-green-600 mb-2">
                        🚀 {t("subscriptionEmails.planUpgraded.celebrationtitle")}
                    </Text>
                    <Text className="text-base text-green-700">
                        {t("subscriptionEmails.planUpgraded.celebrationmessage")}
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.planUpgraded.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.planUpgraded.upgrademessage", {
                        previousPlan: t(`plans.${previousPlan}.name` as any),
                        newPlan: t(`plans.${newPlan}.name` as any)
                    })}
                </Text>
            </Section>

            {/* Upgrade Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.planUpgraded.upgradedetails")}
                    </Text>

                    <Row className="mb-4">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.previousplan")}
                            </Text>
                            <Text className="text-base text-gray-500 line-through">
                                {t(`plans.${previousPlan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.newplan")}
                            </Text>
                            <Text className="text-base font-bold text-green-600">
                                {t(`plans.${newPlan}.name` as any)} ✨
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.newprice")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {amount} {currency}
                            </Text>
                        </Column>
                    </Row>

                    <Row>
                        <Column>
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.effectivedate")}
                            </Text>
                            <Text className="text-base font-semibold text-green-600">
                                {t("subscriptionEmails.planUpgraded.immediateaccess")}
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* New Features Unlocked */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planUpgraded.newfeatures")}
                </Text>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((featureIndex) => (
                            <div key={featureIndex} className="flex items-start">
                                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                                    ✓
                                </div>
                                <div className="flex-1">
                                    <Text className="text-base font-medium text-gray-900 mb-1">
                                        {t(`plans.${newPlan}.features.feature${featureIndex}.title` as any)}
                                    </Text>
                                    <Text className="text-sm text-gray-700">
                                        {t(`plans.${newPlan}.features.feature${featureIndex}.description` as any)}
                                    </Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Getting Started */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planUpgraded.gettingstarted")}
                </Text>
                <div className="space-y-3">
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            1
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.planUpgraded.step1")}
                        </Text>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            2
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.planUpgraded.step2")}
                        </Text>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            3
                        </div>
                        <Text className="text-base text-gray-700 flex-1">
                            {t("subscriptionEmails.planUpgraded.step3")}
                        </Text>
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    <Button
                        href={dashboardUrl}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity duration-200 inline-block w-full max-w-sm"
                    >
                        {t("subscriptionEmails.planUpgraded.accessdashboard")}
                    </Button>
                    <div>
                        <Button
                            href={featuresUrl}
                            className="bg-orange-500 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-orange-600 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.planUpgraded.explorefeatures")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Limits Comparison */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planUpgraded.increasedlimits")}
                </Text>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.studentslimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.students` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planUpgraded.was")} {t(`plans.${previousPlan}.limits.students` as any)}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.courseslimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.courses` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planUpgraded.was")} {t(`plans.${previousPlan}.limits.courses` as any)}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planUpgraded.storagelimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.storage` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planUpgraded.was")} {t(`plans.${previousPlan}.limits.storage` as any)}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.planUpgraded.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.planUpgraded.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
