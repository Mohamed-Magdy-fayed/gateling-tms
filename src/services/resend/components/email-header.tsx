import type { Translator } from "@/services/resend/components/email-layout";
import { Img, Section, Text } from "@react-email/components";

export default function EmailHeader({ logoUrl, t }: { logoUrl: string, t: Translator["t"] }) {
    return (
        <Section className="text-center pt-4 pb-6 border-b border-gray-200 mb-6">
            <Img
                src={logoUrl}
                width="120"
                alt="Gateling-Solutions Logo"
                className="mx-auto mb-3"
            />
            <Text className="text-3xl font-extrabold text-primary leading-tight">
                Gateling-Solutions
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
                {t("emailConfirmation.tagline")}
            </Text>
        </Section>
    )
}
