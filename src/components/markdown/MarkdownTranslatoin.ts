import { dt, type LanguageMessages } from "@/i18n/lib";

export const markdownEn = {
    "frontmatterEditor": {
        "title": "Edit document frontmatter",
        "key": "Key",
        "value": "Value",
        "addEntry": "Add entry"
    },
    "dialogControls": {
        "save": "Save",
        "cancel": "Cancel"
    },
    "uploadImage": {
        "dialogTitle": "Upload an image",
        "uploadInstructions": "Upload an image from your device:",
        "addViaUrlInstructions": "Or add an image from an URL:",
        "autoCompletePlaceholder": "Select or paste an image src",
        "alt": "Alt:",
        "title": "Title:"
    },
    "imageEditor": {
        "deleteImage": "Delete image",
        "editImage": "Edit image"
    },
    "createLink": {
        "url": "URL",
        "urlPlaceholder": "Select or paste an URL",
        "title": "Title",
        "saveTooltip": "Set URL",
        "cancelTooltip": "Cancel change"
    },
    "linkPreview": {
        "open": dt("Open {url} in new window", {}),
        "edit": "Edit link URL",
        "copyToClipboard": "Copy to clipboard",
        "copied": "Copied!",
        "remove": "Remove link"
    },
    "table": {
        "deleteTable": "Delete table",
        "columnMenu": "Column menu",
        "textAlignment": "Text alignment",
        "alignLeft": "Align left",
        "alignCenter": "Align center",
        "alignRight": "Align right",
        "insertColumnLeft": "Insert a column to the left of this one",
        "insertColumnRight": "Insert a column to the right of this one",
        "deleteColumn": "Delete this column",
        "rowMenu": "Row menu",
        "insertRowAbove": "Insert a row above this one",
        "insertRowBelow": "Insert a row below this one",
        "deleteRow": "Delete this row"
    },
    "toolbar": {
        "blockTypes": {
            "paragraph": "Paragraph",
            "quote": "Quote",
            "heading": dt("Heading {level}", {})
        },
        "blockTypeSelect": {
            "selectBlockTypeTooltip": "Select block type",
            "placeholder": "Block type"
        },
        "toggleGroup": "toggle group",
        "removeBold": "Remove bold",
        "bold": "Bold",
        "removeItalic": "Remove italic",
        "italic": "Italic",
        "underline": "Remove underline",
        "removeUnderline": "Underline",
        "removeInlineCode": "Remove code format",
        "inlineCode": "Inline code format",
        "link": "Create link",
        "richText": "Rich text",
        "diffMode": "Diff mode",
        "source": "Source mode",
        "admonition": "Insert Admonition",
        "codeBlock": "Insert Code Block",
        "editFrontmatter": "Edit frontmatter",
        "insertFrontmatter": "Insert frontmatter",
        "image": "Insert image",
        "insertSandpack": "Insert Sandpack",
        "table": "Insert Table",
        "thematicBreak": "Insert thematic break",
        "bulletedList": "Bulleted list",
        "numberedList": "Numbered list",
        "checkList": "Check list",
        "deleteSandpack": "Delete this code block",
        "undo": dt("Undo {shortcut}", {}),
        "redo": dt("Redo {shortcut}", {})
    },
    "admonitions": {
        "note": "Note",
        "tip": "Tip",
        "danger": "Danger",
        "info": "Info",
        "caution": "Caution",
        "changeType": "Select admonition type",
        "placeholder": "Admonition type"
    },
    "codeBlock": {
        "language": "Code block language",
        "selectLanguage": "Select code block language"
    },
    "contentArea": {
        "editableMarkdown": "editable markdown"
    }
} as const satisfies LanguageMessages

export const markdownAr = {
    "frontmatterEditor": {
        "title": "تعديل بيانات الوثيقة",
        "key": "المفتاح",
        "value": "القيمة",
        "addEntry": "إضافة مدخل"
    },
    "dialogControls": {
        "save": "حفظ",
        "cancel": "إلغاء"
    },
    "uploadImage": {
        "dialogTitle": "رفع صورة",
        "uploadInstructions": "قم برفع صورة من جهازك:",
        "addViaUrlInstructions": "أو أضف صورة من رابط:",
        "autoCompletePlaceholder": "اختر أو الصق مصدر الصورة",
        "alt": "النص البديل:",
        "title": "العنوان:"
    },
    "imageEditor": {
        "deleteImage": "حذف الصورة",
        "editImage": "تعديل الصورة"
    },
    "createLink": {
        "url": "الرابط",
        "urlPlaceholder": "اختر أو الصق رابطًا",
        "title": "العنوان",
        "saveTooltip": "تعيين الرابط",
        "cancelTooltip": "إلغاء التغيير"
    },
    "linkPreview": {
        "open": dt("فتح {url} في نافذة جديدة", {}),
        "edit": "تعديل رابط الرابط",
        "copyToClipboard": "نسخ إلى الحافظة",
        "copied": "تم النسخ!",
        "remove": "إزالة الرابط"
    },
    "table": {
        "deleteTable": "حذف الجدول",
        "columnMenu": "قائمة العمود",
        "textAlignment": "محاذاة النص",
        "alignLeft": "محاذاة لليسار",
        "alignCenter": "محاذاة للوسط",
        "alignRight": "محاذاة لليمين",
        "insertColumnLeft": "إدراج عمود إلى يسار هذا العمود",
        "insertColumnRight": "إدراج عمود إلى يمين هذا العمود",
        "deleteColumn": "حذف هذا العمود",
        "rowMenu": "قائمة الصف",
        "insertRowAbove": "إدراج صف فوق هذا الصف",
        "insertRowBelow": "إدراج صف أسفل هذا الصف",
        "deleteRow": "حذف هذا الصف"
    },
    "toolbar": {
        "blockTypes": {
            "paragraph": "فقرة",
            "quote": "اقتباس",
            "heading": dt("عنوان {level}", {})
        },
        "blockTypeSelect": {
            "selectBlockTypeTooltip": "اختر نوع البلوك",
            "placeholder": "نوع البلوك"
        },
        "toggleGroup": "تبديل المجموعة",
        "removeBold": "إزالة التثخين",
        "bold": "تثخين",
        "removeItalic": "إزالة المائل",
        "italic": "مائل",
        "underline": "تسطير",
        "removeUnderline": "إزالة التسطير",
        "removeInlineCode": "إزالة تنسيق الكود",
        "inlineCode": "تنسيق كود داخل السطر",
        "link": "إنشاء رابط",
        "richText": "نص منسق",
        "diffMode": "وضع المقارنة",
        "source": "وضع المصدر",
        "admonition": "إدراج ملاحظة تنبيهية",
        "codeBlock": "إدراج كتلة كود",
        "editFrontmatter": "تعديل بيانات الوثيقة",
        "insertFrontmatter": "إدراج بيانات الوثيقة",
        "image": "إدراج صورة",
        "insertSandpack": "إدراج Sandpack",
        "table": "إدراج جدول",
        "thematicBreak": "إدراج فاصل موضوعي",
        "bulletedList": "قائمة نقطية",
        "numberedList": "قائمة مرقمة",
        "checkList": "قائمة مهام",
        "deleteSandpack": "حذف كتلة الكود هذه",
        "undo": dt("تراجع {shortcut}", {}),
        "redo": dt("إعادة {shortcut}", {})
    },
    "admonitions": {
        "note": "ملاحظة",
        "tip": "نصيحة",
        "danger": "تحذير",
        "info": "معلومة",
        "caution": "انتباه",
        "changeType": "اختر نوع الملاحظة",
        "placeholder": "نوع الملاحظة"
    },
    "codeBlock": {
        "language": "لغة الكود",
        "selectLanguage": "اختر لغة الكود"
    },
    "contentArea": {
        "editableMarkdown": "ماركداون قابل للتعديل"
    }
} as const satisfies LanguageMessages