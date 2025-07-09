import {
    Button,
    Section,
    Text,
} from "@react-email/components";
import type { Translator } from "@/services/resend/components/email-layout";

interface EmailConfirmationProps {
    userName: string;
    confirmLink: string;
    t: Translator["t"];
}

export default function EmailConfirmation({
    userName,
    confirmLink,
    t,
}: EmailConfirmationProps) {
    return (
        <>
            <Section className="mb-6 px-4">
                <Text className="text-lg leading-relaxed text-gray-700 mb-4">
                    {t("emailConfirmation.dear_user", { userName })}
                </Text>
                <Text className="text-base leading-relaxed text-gray-700 mb-4">
                    {t("emailConfirmation.thank_you_registering")}
                </Text>
            </Section>

            {/* Call to Action Button Section */}
            <Section className="text-center mb-8 px-4">
                <Button
                    href={confirmLink}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-xl font-bold hover:bg-gateling-orange-600 transition-colors duration-200 inline-block"
                >
                    {t("emailConfirmation.confirm_email_button")}
                </Button>
            </Section>
            {/* Important Notes Section */}
            <Section className="mb-6 px-4 text-gray-600 text-sm">
                <Text className="leading-relaxed mb-2">
                    {t("emailConfirmation.link_verification_info")}
                </Text>
                <Text className="leading-relaxed">
                    {t("emailConfirmation.security_note")}
                </Text>
            </Section>
        </>
    );
}
