import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface PlanDowngradedProps {
    userName: string;
    previousPlan: string;
    newPlan: string;
    billingCycle: string;
    effectiveDate: string;
    upgradeUrl: string;
    dashboardUrl: string;
    t: Translator["t"];
}

export default function PlanDowngraded({
    userName,
    previousPlan,
    newPlan,
    billingCycle,
    effectiveDate,
    upgradeUrl,
    dashboardUrl,
    t,
}: PlanDowngradedProps) {
    return (
        <>
            {/* Notice Section */}
            <Section className="mb-6 px-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <Text className="text-2xl font-bold text-yellow-600 mb-2">
                        📋 {t("subscriptionEmails.planDowngraded.noticetitle")}
                    </Text>
                    <Text className="text-base text-yellow-700">
                        {t("subscriptionEmails.planDowngraded.noticemessage")}
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.planDowngraded.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.planDowngraded.downgrademessage", {
                        previousPlan: t(`plans.${previousPlan}.name` as any),
                        newPlan: t(`plans.${newPlan}.name` as any)
                    })}
                </Text>
            </Section>

            {/* Downgrade Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.planDowngraded.downgradedetails")}
                    </Text>
                    
                    <Row className="mb-4">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.currentplan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${previousPlan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.newplan")}
                            </Text>
                            <Text className="text-base font-semibold text-orange-600">
                                {t(`plans.${newPlan}.name` as any)}
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.effectivedate")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {new Date(effectiveDate).toLocaleDateString()}
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* What Changes */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planDowngraded.whatchanges")}
                </Text>
                
                {/* Features You'll Lose */}
                <div className="bg-red-50 rounded-lg p-6 border border-red-200 mb-6">
                    <Text className="text-base font-semibold text-red-700 mb-3">
                        {t("subscriptionEmails.planDowngraded.featureslosing")}
                    </Text>
                    <div className="space-y-2">
                        {[1, 2, 3].map((featureIndex) => (
                            <div key={featureIndex} className="flex items-start">
                                <div className="text-red-500 mr-3 mt-1">✗</div>
                                <Text className="text-sm text-red-700">
                                    {t(`plans.${previousPlan}.exclusivefeatures.feature${featureIndex}` as any)}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features You'll Keep */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <Text className="text-base font-semibold text-green-700 mb-3">
                        {t("subscriptionEmails.planDowngraded.featureskeeping")}
                    </Text>
                    <div className="space-y-2">
                        {[1, 2, 3].map((featureIndex) => (
                            <div key={featureIndex} className="flex items-start">
                                <div className="text-green-500 mr-3 mt-1">✓</div>
                                <Text className="text-sm text-green-700">
                                    {t(`plans.${newPlan}.features.feature${featureIndex}` as any)}
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Limits Comparison */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planDowngraded.newlimits")}
                </Text>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.studentslimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.students` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planDowngraded.was")} {t(`plans.${previousPlan}.limits.students` as any)}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.courseslimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.courses` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planDowngraded.was")} {t(`plans.${previousPlan}.limits.courses` as any)}
                            </Text>
                        </div>
                        <div className="text-center">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.planDowngraded.storagelimit")}
                            </Text>
                            <Text className="text-lg font-bold text-blue-600">
                                {t(`plans.${newPlan}.limits.storage` as any)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {t("subscriptionEmails.planDowngraded.was")} {t(`plans.${previousPlan}.limits.storage` as any)}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Important Notice */}
            <Section className="mb-8 px-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <Text className="text-base font-semibold text-orange-700 mb-2">
                        {t("subscriptionEmails.planDowngraded.importantnotice")}
                    </Text>
                    <Text className="text-sm text-orange-700 mb-3">
                        {t("subscriptionEmails.planDowngraded.dataretentionmessage")}
                    </Text>
                    <div className="space-y-2">
                        <div className="flex items-start">
                            <div className="text-orange-500 mr-3 mt-1">•</div>
                            <Text className="text-sm text-orange-700">
                                {t("subscriptionEmails.planDowngraded.backupreminder")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-orange-500 mr-3 mt-1">•</div>
                            <Text className="text-sm text-orange-700">
                                {t("subscriptionEmails.planDowngraded.accesstimeline")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    <Button
                        href={upgradeUrl}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity duration-200 inline-block w-full max-w-sm"
                    >
                        {t("subscriptionEmails.planDowngraded.upgradeagain")}
                    </Button>
                    <div>
                        <Button
                            href={dashboardUrl}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.planDowngraded.manageaccount")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Why Upgrade Again */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.planDowngraded.whyupgrade")}
                </Text>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">🚀</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.planDowngraded.benefit1")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">📈</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.planDowngraded.benefit2")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-purple-600 mr-3 mt-1">🎯</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.planDowngraded.benefit3")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.planDowngraded.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.planDowngraded.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
