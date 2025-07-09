import type { Translator } from "@/services/resend/components/email-layout";
import { Link, Section, Text } from "@react-email/components";

export default function EmailFooter({ t }: { t: Translator["t"] }) {
    return (
        <Section className="text-center text-gray-500 text-xs px-4">
            <Text className="mb-1">
                {/* Pass Date object for year:date formatting */}
                {t("emailFooter.copyright", { year: new Date(), appName: "Gateling-Solutions" })}
            </Text>
            <Text>
                <Link href="https://yourwebsite.com/privacy" className="text-primary hover:underline">
                    {t("emailFooter.navigation.legal.privacyPolicy")}
                </Link>{" "}
                |{" "}
                <Link href="https://yourwebsite.com/terms" className="text-primary hover:underline">
                    {t("emailFooter.navigation.legal.termsOfService")}
                </Link>
            </Text>
            <Text className="mt-2">
                {t("emailConfirmation.contact_us")}
            </Text>
        </Section>
    )
}
