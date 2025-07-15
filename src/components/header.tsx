'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/i18n/useTranslation';
import LogoLink from '@/components/general/logo-link';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { DarkModeSwitcher } from '@/components/dark-mode-switcher';
import { SignIn, SignOut } from '@/components/general/auth';
import { LayoutDashboardIcon, LockOpenIcon, LogInIcon, LogOutIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import WrapWithTooltip from '@/components/general/wrap-with-tooltip';
import QuickLoginForm from '@/features/auth/components/quick-login-form';

export function Header() {
  const { t } = useTranslation();
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="flex items-center gap-4">
            <DarkModeSwitcher />
            <LanguageSwitcher />
            {status === 'unauthenticated' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LogInIcon size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <QuickLoginForm />
                </PopoverContent>
              </Popover>
            )}
            {status === 'authenticated' && <SignOut variant="ghost" size="icon" children={<LogOutIcon />} />}
            {status === 'loading' && <Skeleton className='w-8 h-8' />}
            {status !== 'authenticated' && (
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/get-started">{t('getStarted')}</Link>
              </Button>
            )}
            {status === 'authenticated' && (
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/dashboard"><LayoutDashboardIcon />{t('getStartedForm.success.goToDashboard')}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
