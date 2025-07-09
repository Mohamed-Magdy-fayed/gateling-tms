import type { getI18n } from "@/i18n/lib/get-translations";
import EmailFooter from "@/services/resend/components/email-footer";
import EmailHeader from "@/services/resend/components/email-header";
import tailwindConfig from "@/services/resend/data/tailwindConfig";
import { Body, Container, Head, Hr, Html, Tailwind } from "@react-email/components";
import type React from "react";

export type Translator = Awaited<ReturnType<typeof getI18n>>;

type EmailLayoutProps<P extends object = {}> = {
    translation: Translator;
    logoUrl: string;
    Child: React.ComponentType<P>;
    childProps: P;
};

export default function EmailLayout<P extends object = {}>({ translation, logoUrl, Child, childProps }: EmailLayoutProps<P>) {
    return (
        <Html dir={translation.locale === "ar" ? 'rtl' : 'ltr'}>
            <Head />
            <Tailwind config={tailwindConfig}>
                <Body className="bg-gray-50 font-sans text-gray-800 p-4">
                    <Container className="mx-auto p-6 bg-white rounded-lg shadow-xl my-10 border border-gray-200 max-w-2xl">
                        <EmailHeader logoUrl={logoUrl} t={translation.t} />
                        <Child {...childProps} />
                        <Hr className="border-t border-gray-200 my-8" />
                        <EmailFooter t={translation.t} />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
