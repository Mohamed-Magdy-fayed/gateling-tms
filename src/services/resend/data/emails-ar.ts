import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    emailConfirmation: {
        email_confirmation_subject: "تأكيد عنوان بريدك الإلكتروني لـ Gateling-Solutions",
        dear_user: "عزيزي {userName},",
        thank_you_registering: "شكرًا لتسجيلك في Gateling-Solutions! لإكمال تسجيلك وتفعيل حسابك، يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه.",
        confirm_email_button: "تأكيد بريدك الإلكتروني",
        link_verification_info: "سيؤكد هذا الرابط بريدك الإلكتروني ويمنحك الوصول الكامل إلى خدماتنا. إذا لم تقم بالتسجيل في حساب Gateling-Solutions، يرجى تجاهل هذا البريد الإلكتروني.",
        security_note: "لأمانك، هذا الرابط صالح لفترة محدودة.",
        tagline: "شريكك في التميز الرقمي",
        contact_us: "أسئلة؟ اتصل بنا على support@gateling-solutions.com",
    },
    emailFooter: {
        copyright: dt("© {year:date} {appName}. جميع الحقوق محفوظة.", { date: { year: { year: "numeric" } } }),
        navigation: {
            legal: {
                privacyPolicy: "سياسة الخصوصية",
                termsOfService: "شروط الخدمة",
            },
        },
    },
} as const satisfies LanguageMessages;