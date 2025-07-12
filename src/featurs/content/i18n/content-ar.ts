import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    content: {
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
        }
    }
} as const satisfies LanguageMessages;
