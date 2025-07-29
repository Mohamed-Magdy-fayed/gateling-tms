import landingAr from "@/features/landing-page/landing-ar"
import { dt, type LanguageMessages } from "../lib"
import getStartedAr from "@/features/get-started/get-started-ar"
import emailsAr from "@/services/resend/data/emails-ar"
import authAr from "@/features/auth/i18n/auth-ar"
import sidebarAr from "@/features/system-layout/i18n/sidebar-ar"
import contentAr from "@/features/content/i18n/content-ar"
import { markdownAr } from "@/components/markdown/MarkdownTranslatoin"
import aboutAr from "@/app/[lang]/(landing-page)/about/_shared/about-ar"
import featuresAr from "@/app/[lang]/(landing-page)/features/_shared/features-ar"
import pricingAr from "@/app/[lang]/(landing-page)/pricing/_shared/pricing-ar"
import contactAr from "@/app/[lang]/(landing-page)/contact/_shared/contact-ar"
import plansAr from "@/features/plans/i18n/plans-ar"

export default {
  common: {
    readMore: "اقرأ المزيد",
    selectAll: "تحديد الكل",
    selectRow: "تحديد الصف",
    openMenu: "فتح القائمة",
    edit: "تعديل",
    delete: "حذف",
    back: "رجوع",
    actions: "الإجراءات",
    clear: "مسح",
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
  system: {
    mainNavigation: 'التنقل الرئيسي',
    generalNavigation: 'عام',
    userMenu: {
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      register: 'تسجيل',
    },
    notifications: {
      title: 'الإشعارات',
      markAllAsRead: 'تحديد الكل كمقروء',
      noNotifications: 'لا توجد إشعارات بعد.',
    },
    sidebar: {
      toggle: 'تبديل الشريط الجانبي',
    }
  },
  loading: "جاري التحميل...",
  ...landingAr,
  ...aboutAr,
  ...featuresAr,
  ...pricingAr,
  ...contactAr,
  ...getStartedAr,
  ...emailsAr,
  ...authAr,
  ...sidebarAr,
  ...plansAr,
  ...pricingAr,
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
