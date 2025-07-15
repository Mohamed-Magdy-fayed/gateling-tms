import landingAr from "@/features/landing-page/landing-ar"
import { dt, type LanguageMessages } from "../lib"
import getStartedAr from "@/features/get-started/get-started-ar"
import emailsAr from "@/services/resend/data/emails-ar"
import authAr from "@/features/auth/i18n/auth-ar"
import sidebarAr from "@/features/system-layout/i18n/sidebar-ar"
import contentAr from "@/features/content/i18n/content-ar"
import { markdownAr } from "@/components/markdown/MarkdownTranslatoin"

export default {
  common: {
    selectAll: "تحديد الكل",
    selectRow: "تحديد الصف",
    openMenu: "فتح القائمة",
    edit: "تعديل",
    delete: "حذف",
  },
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
    invalidEmail: "البريد الإلكتروني غير صحيح، يرجى المحاولة مرة أخرى.",
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
  loading: "جاري التحميل...",
  ...landingAr,
  ...getStartedAr,
  ...emailsAr,
  ...authAr,
  ...sidebarAr,
  dataTable: {
    from: "من",
    to: "إلى",
    slider: "شريط {title}",
    clear: "مسح",
    clearFilter: "مسح فلتر {title}",
    export: {
      export: "تصدير",
      clear: "مسح",
      searchPlaceholder: "ابحث في الأعمدة...",
    },
    noColumns: "لا توجد أعمدة.",
    noResults: "لا توجد نتائج.",
    selected: "{count:number} محدد",
    rowsSelected: dt("تم اختيار {selected:number} من {rows:plural}", {
      plural: { rows: { one: "{?} صف", two: "صفان", few: "{?} صفوف", other: "{?} صف" } }
    }),
    clearSelection: "مسح التحديد",
    rowsPerPage: "عدد الصفوف في الصفحة",
    sort: "ترتيب",
    sortBy: "ترتيب حسب",
    noSorting: "لا يوجد ترتيب!",
    modifySorting: "عدّل الترتيب لتنظيم الصفوف.",
    addSorting: "أضف ترتيبًا لتنظيم الصفوف.",
    addSort: "أضف ترتيب",
    resetSorting: "إعادة تعيين الترتيب",
    searchFields: "ابحث في الحقول...",
    noFieldsFound: "لم يتم العثور على حقول.",
    pageOf: dt("صفحة {page:number} من {total:number}", {}),
    asc: "تصاعدي",
    desc: "تنازلي",
    reset: "إعادة تعيين",
    hide: "إخفاء",
    view: "عرض",
  },
  ...contentAr,
  ...markdownAr,
} as const satisfies LanguageMessages
