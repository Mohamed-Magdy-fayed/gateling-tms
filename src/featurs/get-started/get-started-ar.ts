import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    verifyEmail: {
        title: "تأكيد بريدك الإلكتروني",
        subtitle: "أكمل إعداد حسابك",
        description: "نحن نتحقق من عنوان بريدك الإلكتروني لتأمين حسابك",
        loading: "جاري التحقق من بريدك الإلكتروني...",
        loadingDescription: "يرجى الانتظار بينما نؤكد عنوان بريدك الإلكتروني",
        success: {
            title: "تم التحقق من البريد الإلكتروني بنجاح!",
            cta: "المتابعة إلى لوحة التحكم",
            securityNote: {
                title: "حسابك آمن الآن",
                description: "تم التحقق من بريدك الإلكتروني وحسابك جاهز للاستخدام"
            }
        },
        error: {
            title: "فشل التحقق",
            generic: "حدث خطأ أثناء التحقق",
            noToken: "لم يتم العثور على رمز التحقق",
            retry: "حاول مرة أخرى",
            backToSignup: "العودة إلى التسجيل",
            troubleshoot: {
                title: "نصائح لحل المشاكل:",
                checkLink: "تأكد من النقر على الرابط الصحيح من بريدك الإلكتروني",
                expiredLink: "قد يكون رابط التحقق منتهي الصلاحية",
                contactSupport: "اتصل بالدعم إذا استمرت المشكلة"
            }
        },
        passwordless: {
            title: "إعداد تسجيل دخول آمن",
            description: "استخدم بصمة إصبعك أو وجهك أو مفتاح الأمان للوصول بشكل أسرع وأكثر أماناً",
            availableMethod: "متاح",
            setupButton: "إعداد تسجيل الدخول البيومتري",
            skipButton: "المتابعة بالبريد الإلكتروني فقط",
            settingUp: "جاري الإعداد...",
            setupSuccess: "تم إعداد تسجيل الدخول البيومتري بنجاح!",
            setupError: "فشل في إعداد تسجيل الدخول البيومتري",
            benefits: {
                title: "لماذا استخدام تسجيل الدخول البيومتري؟",
                security: "أكثر أماناً من كلمات المرور",
                convenience: "تجربة تسجيل دخول أسرع",
                noPasswords: "لا توجد كلمات مرور للتذكر"
            },
            unsupported: {
                title: "تسجيل الدخول البيومتري غير متاح",
                description: "متصفحك أو جهازك لا يدعم المصادقة البيومترية"
            }
        },
        footer: {
            security: "هذا الرابط آمن وسينتهي خلال 24 ساعة",
            help: "تحتاج مساعدة؟",
            contact: "اتصل بالدعم"
        }
    },
    getStartedForm: {
        hero: {
            title: 'ابدأ مع مميزاتنا المجانية',
            description: 'احكي لنا عن عملك وابدأ فورًا بدون أي التزام، مجانًا بالكامل.',
        },
        progress: {
            stepOfTotal: dt('الخطوة {currentStep:number} من {totalSteps:number}', {}),
        },
        cardTitle: dt('الخطوة {currentStep:number}: {stepTitle}', {}),
        stepTitles: {
            businessInfo: 'معلومات العمل',
            features: 'المميزات والمتطلبات',
            reviewSubmit: 'مراجعة وإرسال',
        },
        step1: {
            contactNameLabel: 'اسم جهة التواصل',
            contactNamePlaceholder: 'اكتب اسمك',
            businessNameLabel: 'اسم العمل',
            businessNamePlaceholder: 'اكتب اسم عملك',
            emailLabel: 'البريد الإلكتروني',
            emailPlaceholder: 'اكتب بريدك الإلكتروني',
            phoneLabel: 'رقم الهاتف',
            phonePlaceholder: 'اكتب رقم هاتفك',
            currentWebsiteLabel: 'الموقع الحالي (اختياري)',
            currentWebsitePlaceholder: 'https://yourwebsite.com',
            additionalNotesLabel: 'ملاحظات إضافية',
            additionalNotesPlaceholder: 'اكتب أي تفاصيل أخرى مهمة...',
        },
        step2: {
            featuresQuestion: 'ما هي المميزات التي تهتم بها؟',
        },
        step3: {
            reviewTitle: 'راجع معلوماتك',
            contactInfo: 'معلومات التواصل',
            businessInfo: 'معلومات العمل',
            featuresInfo: 'المميزات المختارة',
            whatHappensNextTitle: 'ماذا سيحدث بعد ذلك؟',
            nextStep1: 'ابدأ بإضافة المحتوى الخاص بك.',
            nextStep2: 'أضف أعضاء فريقك.',
            nextStep3: 'هذا كل شيء! نظامك جاهز للاستخدام.',
        },
        navigation: {
            previous: 'السابق',
            next: 'التالي',
            letsGo: 'يلا نبدأ',
            preparingYourSystem: 'جاري تجهيز النظام...',
        },
        success: {
            thankYouTitle: dt('شكرًا {name} لاختيارك لنا!', {}),
            confirmationMessage: 'نظامك جاهز الآن. يمكنك البدء فورًا من خلال الذهاب إلى لوحة التحكم.',
            whatHappensNextTitle: 'ماذا سيحدث بعد ذلك؟',
            step1: 'ابدأ بإضافة المحتوى الخاص بك.',
            step2: 'أضف أعضاء فريقك.',
            step3: 'هذا كل شيء! نظامك جاهز للاستخدام.',
            step4: 'يمكنك دائمًا التواصل معنا للدعم.',
            returnToHomepage: 'العودة للصفحة الرئيسية',
            goToDashboard: 'الذهاب إلى لوحة التحكم',
        },
        premuim: {
            some: "لقد اخترت بعض الخصائص المميزة.",
            description: "للحصول على هذه الخصائص، يرجى الاطلاع على خطط الأسعار.",
            prices: "عرض الأسعار",
        },
        featureLabels: {
            content_library: "مكتبة المحتوى",
            learning_flow: "مسار التعلم",
            live_classes: "حصص مباشرة",
            hr: "الموارد البشرية",
            course_store: "متجر الدورات",
            crm: "إدارة العملاء",
            smart_forms: "نماذج ذكية",
            support: "الدعم",
            community: "المجتمع",
        },
    }
} as const satisfies LanguageMessages;