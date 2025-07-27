"use client"

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { useTranslation } from "@/i18n/useTranslation"

export function MarkdownPartial({
  mainMarkdown,
  dialogMarkdown,
  dialogTitle,
}: {
  mainMarkdown: ReactNode
  dialogMarkdown: ReactNode
  dialogTitle: string
}) {
  const { t } = useTranslation();

  const [isOverflowing, setIsOverflowing] = useState(false)

  const markdownRef = useRef<HTMLDivElement>(null)
  function checkOverflow(node: HTMLDivElement) {
    setIsOverflowing(node.scrollHeight > node.clientHeight)
  }

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener(
      "resize",
      () => {
        if (markdownRef.current == null) return
        checkOverflow(markdownRef.current)
      },
      { signal: controller.signal }
    )

    return () => {
      controller.abort()
    }
  }, [])

  useLayoutEffect(() => {
    if (markdownRef.current == null) return
    checkOverflow(markdownRef.current)
  }, [])

  return (
    <div ref={markdownRef} className="max-h-[300px] overflow-hidden relative rounded-2xl p-2">
      {mainMarkdown}
      {isOverflowing && (
        <>
          <div className="bg-gradient-to-t from-background to-foreground/5 to-25% inset-0 absolute pointer-events-none" />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="underline hover:bg-background/50 rounded-t-none absolute bottom-0 left-0 right-0">
                {t("common.readMore")}
              </Button>
            </DialogTrigger>
            <DialogContent className="md:max-w-3xl lg:max-w-4xl max-h-[calc(100%-2rem)] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">{dialogMarkdown}</div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
