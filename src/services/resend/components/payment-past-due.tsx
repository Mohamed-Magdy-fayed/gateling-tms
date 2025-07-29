import {
    Button,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface PaymentPastDueProps {
    userName: string;
    plan: string;
    billingCycle: string;
    dueDate: string;
    amount: number;
    currency: string;
    updatePaymentUrl: string;
    supportUrl: string;
    t: Translator["t"];
}

export default function PaymentPastDue({
    userName,
    plan,
    billingCycle,
    dueDate,
    amount,
    currency,
    updatePaymentUrl,
    supportUrl,
    t,
}: PaymentPastDueProps) {
    const daysPastDue = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysPastDue >= 7;

    return (
        <>
            {/* Urgent Alert */}
            <Section className="mb-6 px-4">
                <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center`}>
                    <Text className="text-2xl font-bold text-red-600 mb-2">
                        🚨 {t("subscriptionEmails.pastDue.urgenttitle")}
                    </Text>
                    <Text className="text-base text-red-700">
                        {isUrgent
                            ? t("subscriptionEmails.pastDue.urgentmessage")
                            : t("subscriptionEmails.pastDue.overduemessage")
                        }
                    </Text>
                </div>
            </Section>

            {/* Greeting */}
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.pastDue.dearuser", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("subscriptionEmails.pastDue.paymentoverduemessage", {
                        plan: t(`plans.${plan}.name` as any),
                        days: daysPastDue
                    })}
                </Text>
            </Section>

            {/* Payment Details */}
            <Section className="mb-8 px-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <Text className="text-lg font-semibold text-primary mb-4">
                        {t("subscriptionEmails.pastDue.overduepayment")}
                    </Text>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.pastDue.subscriptionplan")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`plans.${plan}.name` as any)}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.pastDue.billingcycle")}
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                                {t(`billing.${billingCycle}` as any)}
                            </Text>
                        </Column>
                    </Row>

                    <Row className="mb-3">
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.pastDue.amountdue")}
                            </Text>
                            <Text className="text-2xl font-bold text-red-600">
                                {amount} {currency}
                            </Text>
                        </Column>
                        <Column className="w-1/2">
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.pastDue.originalduedate")}
                            </Text>
                            <Text className="text-base font-semibold text-red-600">
                                {new Date(dueDate).toLocaleDateString()}
                            </Text>
                        </Column>
                    </Row>

                    <Row>
                        <Column>
                            <Text className="text-sm font-medium text-gray-600 mb-1">
                                {t("subscriptionEmails.pastDue.daysoverdue")}
                            </Text>
                            <Text className="text-lg font-bold text-red-600">
                                {daysPastDue} {t("subscriptionEmails.pastDue.days")}
                            </Text>
                        </Column>
                    </Row>
                </div>
            </Section>

            {/* Immediate Action Required */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.pastDue.immediateaction")}
                </Text>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            1
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.pastDue.step1title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.step1description")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            2
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.pastDue.step2title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.step2description")}
                            </Text>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            3
                        </div>
                        <div className="flex-1">
                            <Text className="text-base font-medium text-gray-900 mb-1">
                                {t("subscriptionEmails.pastDue.step3title")}
                            </Text>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.step3description")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Consequences Warning */}
            <Section className="mb-8 px-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <Text className="text-base font-semibold text-yellow-700 mb-2">
                        ⚠️ {t("subscriptionEmails.pastDue.consequencestitle")}
                    </Text>
                    <Text className="text-sm text-yellow-700 mb-3">
                        {t("subscriptionEmails.pastDue.consequencesintro")}
                    </Text>
                    <div className="space-y-2">
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.pastDue.consequence1")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.pastDue.consequence2")}
                            </Text>
                        </div>
                        <div className="flex items-start">
                            <div className="text-yellow-600 mr-3 mt-1">•</div>
                            <Text className="text-sm text-yellow-700">
                                {t("subscriptionEmails.pastDue.consequence3")}
                            </Text>
                        </div>
                        {isUrgent && (
                            <div className="flex items-start">
                                <div className="text-red-600 mr-3 mt-1">•</div>
                                <Text className="text-sm text-red-700 font-semibold">
                                    {t("subscriptionEmails.pastDue.urgentconsequence")}
                                </Text>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Action Buttons */}
            <Section className="text-center mb-8 px-4">
                <div className="space-y-4">
                    <Button
                        href={updatePaymentUrl}
                        className="bg-red-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-red-700 transition-colors duration-200 inline-block w-full max-w-sm"
                    >
                        {t("subscriptionEmails.pastDue.updatepaymentmethod")}
                    </Button>
                    <div>
                        <Button
                            href={supportUrl}
                            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-200 transition-colors duration-200 inline-block"
                        >
                            {t("subscriptionEmails.pastDue.contactsupport")}
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Common Payment Issues */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.pastDue.commonissues")}
                </Text>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <Text className="text-base text-gray-700 mb-4">
                        {t("subscriptionEmails.pastDue.issuesintro")}
                    </Text>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">💳</div>
                            <div className="flex-1">
                                <Text className="text-sm font-medium text-gray-900 mb-1">
                                    {t("subscriptionEmails.pastDue.issue1title")}
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    {t("subscriptionEmails.pastDue.issue1desc")}
                                </Text>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">🏦</div>
                            <div className="flex-1">
                                <Text className="text-sm font-medium text-gray-900 mb-1">
                                    {t("subscriptionEmails.pastDue.issue2title")}
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    {t("subscriptionEmails.pastDue.issue2desc")}
                                </Text>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">📧</div>
                            <div className="flex-1">
                                <Text className="text-sm font-medium text-gray-900 mb-1">
                                    {t("subscriptionEmails.pastDue.issue3title")}
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    {t("subscriptionEmails.pastDue.issue3desc")}
                                </Text>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-3 mt-1">🔒</div>
                            <div className="flex-1">
                                <Text className="text-sm font-medium text-gray-900 mb-1">
                                    {t("subscriptionEmails.pastDue.issue4title")}
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    {t("subscriptionEmails.pastDue.issue4desc")}
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Account Status */}
            <Section className="mb-8 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.pastDue.currentstatus")}
                </Text>
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Text className="text-sm font-medium text-gray-600 mb-2">
                                {t("subscriptionEmails.pastDue.accountaccess")}
                            </Text>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <Text className="text-sm font-semibold text-red-700">
                                    {isUrgent
                                        ? t("subscriptionEmails.pastDue.suspended")
                                        : t("subscriptionEmails.pastDue.limited")
                                    }
                                </Text>
                            </div>
                        </div>
                        <div>
                            <Text className="text-sm font-medium text-gray-600 mb-2">
                                {t("subscriptionEmails.pastDue.datasafety")}
                            </Text>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <Text className="text-sm font-semibold text-green-700">
                                    {t("subscriptionEmails.pastDue.datasecure")}
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* We're Here to Help */}
            <Section className="mb-6 px-4">
                <Text className="text-lg font-semibold text-primary mb-4">
                    {t("subscriptionEmails.pastDue.helptitle")}
                </Text>
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <Text className="text-base text-gray-700 mb-4">
                        {t("subscriptionEmails.pastDue.helpmessage")}
                    </Text>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="text-green-600 mr-3">📞</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.contactphone")}
                            </Text>
                        </div>
                        <div className="flex items-center">
                            <div className="text-green-600 mr-3">💬</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.contactchat")}
                            </Text>
                        </div>
                        <div className="flex items-center">
                            <div className="text-green-600 mr-3">📧</div>
                            <Text className="text-sm text-gray-700">
                                {t("subscriptionEmails.pastDue.contactemail")}
                            </Text>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Support Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("subscriptionEmails.pastDue.supportmessage")}
                </Text>
                <Text className="leading-relaxed">
                    {t("subscriptionEmails.pastDue.teamsignature")}
                </Text>
            </Section>
        </>
    );
}
