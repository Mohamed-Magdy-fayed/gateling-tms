import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    sidebar: {
        notifications: "الإشعارات",
        logout: "تسجيل الخروج"
    },
    nav: {
        dashboard: "لوحة التحكم",
        operationsManagement: "إدارة العمليات",
        notes: "ملاحظات",
        groups: "المجموعات",
        traineeLists: "قوائم المتدربين",
        placementTests: "اختبارات تحديد المستوى",
        sessions: "الجلسات",
        salesManagement: "إدارة المبيعات",
        orders: "الطلبات",
        leads: "العملاء المحتملون",
        usersManagement: "إدارة المستخدمين",
        students: "الطلاب",
        operationalTeam: "فريق العمليات",
        educationalTeam: "الفريق التعليمي",
        account: "الحساب",
        systemManagement: "إدارة النظام",
        configurations: "الإعدادات",
        contentManagement: "إدارة المحتوى",
        productsManagement: "إدارة المنتجات",
        general: "عام",
        privacyPolicy: "سياسة الخصوصية",
        termsOfUse: "شروط الاستخدام",
        documentation: "التوثيق",
        support: "الدعم"
    }
} as const satisfies LanguageMessages;
