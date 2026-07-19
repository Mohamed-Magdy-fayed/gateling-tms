import type { LanguageMessages } from "../lib";

export default {
  locale: "ar",
  opposite: "English",
  appName: "Gateling-TMS",
  logoName: "Gateling",
  nav: {
    dashboard: "لوحة التحكم",
    contentLibrary: "مكتبة المحتوى",
    learningFlow: "مسار التعلم",
    liveClasses: "الحصص المباشرة",
    settings: "الإعدادات",
  },
  actions: {
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    create: "إنشاء",
    search: "بحث",
  },
  common: {
    loading: "جاري التحميل...",
    empty: "لا توجد بيانات متاحة.",
    required: "مطلوب",
    yes: "نعم",
    no: "لا",
    confirm: "تأكيد",
    areYouSure: "هل أنت متأكد؟",
    back: "رجوع",
    next: "التالي",
    close: "إغلاق",
  },
  errors: {
    generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    notFound: "العنصر المطلوب غير موجود.",
    unauthorized: "غير مصرح لك بتنفيذ هذا الإجراء.",
    validationFailed: "يرجى مراجعة الحقول المظللة والمحاولة مرة أخرى.",
  },
  languageToggle: "تغيير اللغة",
  themeToggle: "تغيير المظهر",
} as const satisfies LanguageMessages;
