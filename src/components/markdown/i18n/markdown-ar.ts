import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    markdown: {
        frontmatterEditor: {
            title: "تعديل بيانات الوثيقة",
            key: "المفتاح",
            value: "القيمة",
            addEntry: "إضافة مدخل"
        },
        dialogControls: {
            save: "حفظ",
            cancel: "إلغاء"
        },
        uploadImage: {
            dialogTitle: "رفع صورة",
            uploadInstructions: "قم برفع صورة من جهازك:",
            addViaUrlInstructions: "أو أضف صورة من رابط:",
            autoCompletePlaceholder: "اختر أو الصق مصدر الصورة",
            alt: "النص البديل:",
            title: "العنوان:"
        },
        imageEditor: {
            deleteImage: "حذف الصورة",
            editImage: "تعديل الصورة"
        },
        createLink: {
            url: "الرابط",
            urlPlaceholder: "اختر أو الصق رابطًا",
            title: "العنوان",
            saveTooltip: "تعيين الرابط",
            cancelTooltip: "إلغاء التغيير"
        },
        linkPreview: {
            open: dt("فتح {url} في نافذة جديدة", {}),
            edit: "تعديل رابط الرابط",
            copyToClipboard: "نسخ إلى الحافظة",
            copied: "تم النسخ!",
            remove: "إزالة الرابط"
        },
        table: {
            deleteTable: "حذف الجدول",
            columnMenu: "قائمة العمود",
            textAlignment: "محاذاة النص",
            alignLeft: "محاذاة لليسار",
            alignCenter: "محاذاة للوسط",
            alignRight: "محاذاة لليمين",
            insertColumnLeft: "إدراج عمود إلى يسار هذا العمود",
            insertColumnRight: "إدراج عمود إلى يمين هذا العمود",
            deleteColumn: "حذف هذا العمود",
            rowMenu: "قائمة الصف",
            insertRowAbove: "إدراج صف فوق هذا الصف",
            insertRowBelow: "إدراج صف أسفل هذا الصف",
            deleteRow: "حذف هذا الصف"
        },
        toolbar: {
            blockTypes: {
                paragraph: "فقرة",
                quote: "اقتباس",
                heading: dt("عنوان {level}", {})
            },
            blockTypeSelect: {
                selectBlockTypeTooltip: "اختر نوع البلوك",
                placeholder: "نوع البلوك"
            },
            toggleGroup: "تبديل المجموعة",
            removeBold: "إزالة التثخين",
            bold: "تثخين",
            removeItalic: "إزالة المائل",
            italic: "مائل",
            underline: "تسطير",
            removeUnderline: "إزالة التسطير",
            removeInlineCode: "إزالة تنسيق الكود",
            inlineCode: "تنسيق كود داخل السطر",
            link: "إنشاء رابط",
            richText: "نص منسق",
            diffMode: "وضع المقارنة",
            source: "وضع المصدر",
            admonition: "إدراج ملاحظة تنبيهية",
            codeBlock: "إدراج كتلة كود",
            editFrontmatter: "تعديل بيانات الوثيقة",
            insertFrontmatter: "إدراج بيانات الوثيقة",
            image: "إدراج صورة",
            insertSandpack: "إدراج Sandpack",
            table: "إدراج جدول",
            thematicBreak: "إدراج فاصل موضوعي",
            bulletedList: "قائمة نقطية",
            numberedList: "قائمة مرقمة",
            checkList: "قائمة مهام",
            deleteSandpack: "حذف كتلة الكود هذه",
            undo: dt("تراجع {shortcut}", {}),
            redo: dt("إعادة {shortcut}", {})
        },
        admonitions: {
            note: "ملاحظة",
            tip: "نصيحة",
            danger: "تحذير",
            info: "معلومة",
            caution: "انتباه",
            changeType: "اختر نوع الملاحظة",
            placeholder: "نوع الملاحظة"
        },
        codeBlock: {
            language: "لغة الكود",
            selectLanguage: "اختر لغة الكود"
        },
        contentArea: {
            editableMarkdown: "ماركداون قابل للتعديل"
        }
    }
} as const satisfies LanguageMessages