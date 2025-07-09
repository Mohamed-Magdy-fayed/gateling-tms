import landingAr from "@/featurs/landing-page/landing-ar"
import { dt, type LanguageMessages } from "../lib"
import getStartedAr from "@/featurs/get-started/get-started-ar"
import { emailsAr } from "@/services/resend/data/emails-ar"

export default {
  locale: "ar",
  greetings: "مرحبًا {name}! آخر تسجيل دخول لك كان في {lastLoginDate:date}.",
  inboxMessages: dt("مرحبًا {name}، لديك {messages:plural}.", {
    plural: { messages: { one: "رسالة واحدة", other: "{?} رسائل" } },
  }),
  hobby: dt("اخترت {hobby:enum} كهوايتك.", {
    enum: { hobby: { runner: "عداء", developer: "مطور" } },
  }),
  nested: {
    greetings: "مرحبًا"
  },
  languageToggle: 'تبديل اللغة',
  themeToggle: 'تبديل الالوان',
  getStarted: 'يلا نبدأ مجاناً',
  premium: 'مميز',
  error: dt('حدث خطأ {error}. يرجى المحاولة مرة أخرى لاحقًا.', {}),
  errors: {
    emailExists: 'البريد الإلكتروني مستخدم بالفعل!',
  },
  header: {
    navigation: {
      home: 'الرئيسية',
      services: 'الخدمات',
      portfolio: 'أعمالنا',
      templates: 'القوالب',
      about: 'حولنا',
      contact: 'اتصل بنا',
    },
    themeToggle: 'تبديل السمة',
    languageToggle: 'تبديل اللغة',
    ctaButton: 'ابدأ الآن',
    mobileMenuToggle: 'تبديل القائمة',
  },
  footer: {
    companyInfo: {
      description: 'خدمات تطوير مواقع مواقع احترافية تساعد الشركات على النمو عبر الإنترنت. من الفكرة إلى الإطلاق، ننشئ مواقع ويب تحول الزوار إلى عملاء.',
      location: 'فريق عن بعد • خدمة العملاء في جميع أنحاء العالم',
    },
    navigation: {
      services: {
        title: 'الخدمات',
        websiteDevelopment: 'تطوير مواقع',
        websiteDesign: 'تصميم المواقع',
        ecommerceSolutions: 'حلول التجارة الإلكترونية',
        seoOptimization: 'تحسين محركات البحث',
        websiteMaintenance: 'صيانة المواقع',
      },
      company: {
        title: 'الشركة',
        aboutUs: 'حولنا',
        ourProcess: 'عمليتنا',
        portfolio: 'أعمالنا',
        testimonials: 'الشهادات',
        blog: 'المدونة',
      },
      resources: {
        title: 'المصادر',
        templates: 'القوالب',
        pricing: 'الأسعار',
        faq: 'الأسئلة الشائعة',
        support: 'الدعم',
        contact: 'اتصل بنا',
      },
      legal: {
        title: 'قانوني',
        privacyPolicy: 'سياسة الخصوصية',
        termsOfService: 'شروط الخدمة',
        cookiePolicy: 'سياسة ملفات تعريف الارتباط',
        refundPolicy: 'سياسة الاسترداد',
      },
    },
    newsletter: {
      title: 'ابق على اطلاع',
      description: 'احصل على نصائح ورؤى تصل إلى بريدك الوارد',
      placeholder: 'أدخل البريد الإلكتروني',
      subscribeButton: 'اشترك',
    },
    copyright: dt('© {year:date} {appName}. جميع الحقوق محفوظة.', { date: { year: { year: "numeric" } } }),
  },
  ...landingAr,
  ...getStartedAr,
  ...emailsAr,
} as const satisfies LanguageMessages
