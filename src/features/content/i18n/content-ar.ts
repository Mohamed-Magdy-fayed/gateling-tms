import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    content: {
    courses: {
      name: "اسم الدورة",
      searchPlaceholder: "ابحث عن الدورات...",
      createdAt: "تاريخ الإنشاء",
      actionBar: {
        exportTooltip: "تصدير الدورات المحددة",
        deleteTooltip: "حذف الدورات المحددة",
      },
    },
        courseForm: {
            name: "اسم الدورة",
            namePlaceholder: "دورة للمبتدئين",
            description: "الوصف",
            image: "صورة الدورة",
            privatePrice: "سعر خاص",
            groupPrice: "سعر المجموعة",
            instructorPrice: "سعر المدرب",
            pricePlaceholder: "مثال: 99.99",
            cancel: "إلغاء",
            reset: "إعادة تعيين",
            submit: "إرسال",
            new: "دورة جديدة",
            update: "تعديل الدورة",
            courses: "الدورات",
            create: "إنشاء دورة",
            createdSuccess: dt("تم إنشاء الدورة باسم: {name} بنجاح!", {}),
            title: "إنشاء دورة جديدة",
            formDescription: "املأ التفاصيل أدناه لإضافة دورة جديدة.",
            formDescriptionUpdate: "قم بتحديث تفاصيل الدورة أدناه.",
        },
        courseSheet: {
            updateTitle: "تعديل الدورة",
            createTitle: "إنشاء دورة",
            updateDescription: "قم بتحديث تفاصيل الدورة واحفظ التغييرات.",
            createDescription: "املأ التفاصيل أدناه لإضافة دورة جديدة.",
            cancel: "إلغاء",
            save: "حفظ",
            create: "إنشاء",
            updateSuccess: "تم تعديل الدورة بنجاح!",
            createSuccess: "تم إنشاء الدورة بنجاح!",
        },
        deleteCoursesDialog: {
            title: "هل أنت متأكد تمامًا؟",
            description: dt("لا يمكن التراجع عن هذا الإجراء. سيتم حذف {count:plural} بشكل دائم من خوادمنا.", {
                plural: { count: { one: "{?} كورس", other: "{?} كورسات" } }
            }),
            triggerButton: dt("حذف {count}", {}),
            cancel: "إلغاء",
            delete: "حذف",
            ariaLabel: "حذف الصفوف المحددة",
            deleteSuccess: dt("تم حذف {count:plural}", { plural: { count: { one: "كورس", other: "كورسات" } } }),
            deleteError: "فشل حذف الدورات. يرجى المحاولة مرة أخرى."
        }
    }
} as const satisfies LanguageMessages;
