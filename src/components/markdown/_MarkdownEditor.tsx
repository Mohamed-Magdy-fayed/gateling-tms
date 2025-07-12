"use client"

import "@mdxeditor/editor/style.css"
import { useIsDarkMode } from "@/hooks/use-is-dark-mode"
import { cn } from "@/lib/utils"
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  InsertTable,
  InsertThematicBreak,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor"
import { type Ref } from "react"
import { markdownClassNames } from "./MarkdownRenderer"
import { useTranslation } from "@/i18n/useTranslation"

export default function InternalMarkdownEditor({
  ref,
  className,
  ...props
}: MDXEditorProps & { ref?: Ref<MDXEditorMethods> }) {
  const isDarkMode = useIsDarkMode()
  const { t, locale } = useTranslation()

  return (
    <MDXEditor
      {...props}
      ref={ref}
      className={cn(markdownClassNames, isDarkMode && "dark-theme prose-invert", className)}
      suppressHtmlProcessing
      translation={(key, _, inter) => t(key as any, { level: inter?.level })}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        tablePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <InsertThematicBreak />
              <InsertTable />
            </>
          ),
        }),
      ]}
    />
  )
}
