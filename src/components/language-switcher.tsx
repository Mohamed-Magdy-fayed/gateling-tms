"use client";

import Link from "next/link";
import { GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className, ...props }: ComponentProps<typeof Button>) {
  const { t, switchLanguage } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={cn(className)}
      {...props}
    >
      <Link href={switchLanguage()}>
        <GlobeIcon size={20} />
        <span className="sr-only">{t('languageToggle')}</span>
      </Link>
    </Button>
  );
}
