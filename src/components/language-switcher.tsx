"use client";

import Link from "next/link";
import { GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

export function LanguageSwitcher() {
  const { t, switchLanguage } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
    >
      <Link href={switchLanguage()}>
        <GlobeIcon size={20} />
        <span className="sr-only">{t('languageToggle')}</span>
      </Link>
    </Button>
  );
}
