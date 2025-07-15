import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    auth: {
        signin: {
            title: "تسجيل الدخول",
            subtitle: "سجّل دخولك للمتابعة",
            button: "تسجيل الدخول باستخدام مفتاح المرور",
            loading: "جاري تسجيل الدخول...",
            noAccount: "ليس لديك حساب؟",
            signup: "سجّل الآن"
        },
        email: "البريد الإلكتروني",
        placeholder: "you@example.com",
        backToHome: 'العودة إلى الصفحة الرئيسية',
        emailPlaceholder: 'name@example.com',
        orContinueWith: 'أو تابع باستخدام',
        signIn: {
            title: 'تسجيل الدخول',
            description: 'أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك',
            withEmail: 'تسجيل الدخول بالبريد الإلكتروني',
            withGitHub: 'تسجيل الدخول باستخدام GitHub',
            noAccount: 'ليس لديك حساب؟ سجل الآن',
        },
        error: {
            title: 'خطأ في المصادقة',
            description: 'حدث خطأ أثناء المصادقة. يرجى المحاولة مرة أخرى.',
            tryAgain: 'يرجى المحاولة مرة أخرى.',
            signInAgain: 'تسجيل الدخول مرة أخرى',
        },
    },
    site: {
        termsPrefix: "بالضغط على متابعة، أنت توافق على",
        terms: "شروط الخدمة",
        and: "و",
        privacy: "سياسة الخصوصية"
    }
} as const satisfies LanguageMessages;