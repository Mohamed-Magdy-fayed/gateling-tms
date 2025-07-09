import { dt, type LanguageMessages } from "@/i18n/lib";

export const emailsEn = {
    emailConfirmation: {
        email_confirmation_subject: "Confirm Your Email Address for Gateling-Solutions",
        dear_user: "Dear {userName},",
        thank_you_registering: "Thank you for registering with Gateling-Solutions! To complete your registration and activate your account, please confirm your email address by clicking the button below.",
        confirm_email_button: "Confirm Your Email",
        link_verification_info: "This link will verify your email and grant you full access to our services. If you did not register for a Gateling-Solutions account, please disregard this email.",
        security_note: "For your security, this link is valid for a limited time.",
        tagline: "Your Partner in Digital Excellence",
        contact_us: "Questions? Contact us at support@gateling-solutions.com",
    },
    emailFooter: {
        copyright: dt("© {year:date} {appName}. All rights reserved.", { date: { year: { year: "numeric" } } }),
        navigation: {
            legal: {
                privacyPolicy: "Privacy Policy",
                termsOfService: "Terms of Service",
            },
        },
    },
} as const satisfies LanguageMessages;