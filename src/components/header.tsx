'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/i18n/useTranslation';
import LogoLink from '@/components/general/logo-link';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { DarkModeSwitcher } from '@/components/dark-mode-switcher';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 gap-4 items-center justify-between">
          {/* Logo */}
          <LogoLink />

          {/* Desktop Navigation */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href='/' className={navigationMenuTriggerStyle()}>
                  {t("header.navigation.home")}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <DarkModeSwitcher />
            <LanguageSwitcher />
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/get-started">{t('getStarted')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
