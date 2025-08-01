"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function DarkModeSwitcher({ className, ...props }: ComponentProps<typeof Button>) {
  const { t } = useTranslation()
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(className)}
      {...props}
    >
      <SunIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <MoonIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <span className="sr-only">{t('themeToggle')}</span>
    </Button>
  );
}
