import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    markdown: {
        frontmatterEditor: {
            title: "Edit document frontmatter",
            key: "Key",
            value: "Value",
            addEntry: "Add entry"
        },
        dialogControls: {
            save: "Save",
            cancel: "Cancel"
        },
        uploadImage: {
            dialogTitle: "Upload an image",
            uploadInstructions: "Upload an image from your device:",
            addViaUrlInstructions: "Or add an image from an URL:",
            autoCompletePlaceholder: "Select or paste an image src",
            alt: "Alt:",
            title: "Title:"
        },
        imageEditor: {
            deleteImage: "Delete image",
            editImage: "Edit image"
        },
        createLink: {
            url: "URL",
            urlPlaceholder: "Select or paste an URL",
            title: "Title",
            saveTooltip: "Set URL",
            cancelTooltip: "Cancel change"
        },
        linkPreview: {
            open: dt("Open {url} in new window", {}),
            edit: "Edit link URL",
            copyToClipboard: "Copy to clipboard",
            copied: "Copied!",
            remove: "Remove link"
        },
        table: {
            deleteTable: "Delete table",
            columnMenu: "Column menu",
            textAlignment: "Text alignment",
            alignLeft: "Align left",
            alignCenter: "Align center",
            alignRight: "Align right",
            insertColumnLeft: "Insert a column to the left of this one",
            insertColumnRight: "Insert a column to the right of this one",
            deleteColumn: "Delete this column",
            rowMenu: "Row menu",
            insertRowAbove: "Insert a row above this one",
            insertRowBelow: "Insert a row below this one",
            deleteRow: "Delete this row"
        },
        toolbar: {
            blockTypes: {
                paragraph: "Paragraph",
                quote: "Quote",
                heading: dt("Heading {level}", {})
            },
            blockTypeSelect: {
                selectBlockTypeTooltip: "Select block type",
                placeholder: "Block type"
            },
            toggleGroup: "toggle group",
            removeBold: "Remove bold",
            bold: "Bold",
            removeItalic: "Remove italic",
            italic: "Italic",
            underline: "Remove underline",
            removeUnderline: "Underline",
            removeInlineCode: "Remove code format",
            inlineCode: "Inline code format",
            link: "Create link",
            richText: "Rich text",
            diffMode: "Diff mode",
            source: "Source mode",
            admonition: "Insert Admonition",
            codeBlock: "Insert Code Block",
            editFrontmatter: "Edit frontmatter",
            insertFrontmatter: "Insert frontmatter",
            image: "Insert image",
            insertSandpack: "Insert Sandpack",
            table: "Insert Table",
            thematicBreak: "Insert thematic break",
            bulletedList: "Bulleted list",
            numberedList: "Numbered list",
            checkList: "Check list",
            deleteSandpack: "Delete this code block",
            undo: dt("Undo {shortcut}", {}),
            redo: dt("Redo {shortcut}", {})
        },
        admonitions: {
            note: "Note",
            tip: "Tip",
            danger: "Danger",
            info: "Info",
            caution: "Caution",
            changeType: "Select admonition type",
            placeholder: "Admonition type"
        },
        codeBlock: {
            language: "Code block language",
            selectLanguage: "Select code block language"
        },
        contentArea: {
            editableMarkdown: "editable markdown"
        }
    }
} as const satisfies LanguageMessages