'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useIsDarkMode() {
  const { resolvedTheme } = useTheme()

  const [isMounted, setIsMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false

    return window.matchMedia("(prefers-color-scheme: dark)").matches || resolvedTheme === "dark"
  })

  useEffect(() => { setIsDarkMode(resolvedTheme === "dark") }, [resolvedTheme])

  useEffect(() => {
    const controller = new AbortController()
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      e => {
        setIsDarkMode(e.matches)
      },
      { signal: controller.signal }
    )

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return undefined
  }

  return isDarkMode
}
