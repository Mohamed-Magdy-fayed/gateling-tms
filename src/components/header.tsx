'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/i18n/useTranslation';
import LogoLink from '@/components/general/logo-link';
import { DarkModeSwitcher } from '@/components/dark-mode-switcher';
import { SignOut } from '@/components/general/auth';
import {
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QuickLoginForm from '@/features/auth/components/quick-login-form';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const { status } = useSession();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: t('header.navigation.home'), href: '/' },
    { name: t('header.navigation.about'), href: '/about' },
    { name: t('header.navigation.features'), href: '/features' },
    { name: t('header.navigation.pricing'), href: '/pricing' },
    { name: t('header.navigation.contact'), href: '/contact' },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
        isScrolled
          ? "border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/80"
          : "border-b border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="container mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex h-16 gap-4 items-center justify-between">
          {/* Logo with enhanced styling */}
          <div className="flex-shrink-0 transition-transform duration-200 hover:scale-105">
            <LogoLink />
          </div>

          {/* Desktop Navigation with enhanced styling */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-200 rounded-md hover:bg-accent/50 group"
              >
                {item.name}
                <span className="absolute inset-x-4 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </Link>
            ))}
          </nav>

          {/* Right side actions with improved spacing and animations */}
          <div className="flex items-center gap-2">
            {/* Theme and Language Switchers */}
            <div className="flex items-center gap-1">
              <div >
                <DarkModeSwitcher className="transition-transform duration-200 hover:translate-y-0.5" />
              </div>
              <div >
                <LanguageSwitcher className="transition-transform duration-200 hover:translate-y-0.5" />
              </div>
            </div>

            {/* Authentication Actions */}
            <div className="flex items-center gap-2 ml-2">
              {status === 'unauthenticated' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="transition-all duration-200 hover:scale-105 hover:bg-accent"
                    >
                      <LogInIcon size={16} className="mr-2" />
                      <span className="hidden sm:inline">Login</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <QuickLoginForm />
                  </PopoverContent>
                </Popover>
              )}

              {status === 'authenticated' && (
                <SignOut
                  variant="ghost"
                  size="sm"
                  className="transition-all duration-200 hover:translate-y-0.5 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOutIcon size={16} />
                </SignOut>
              )}

              {status === 'loading' && (
                <Skeleton className='w-20 h-8 rounded-md' />
              )}

              {/* CTA Buttons */}
              {status !== 'authenticated' && (
                <Button
                  asChild
                  className="hidden sm:inline-flex transition-all duration-200 hover:translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <Link href="/get-started">
                    {t('getStarted')}
                  </Link>
                </Button>
              )}

              {status === 'authenticated' && (
                <Button
                  asChild
                  className="hidden md:inline-flex transition-all duration-200 hover:translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <Link href="/dashboard">
                    <LayoutDashboardIcon size={16} className="mr-2" />
                    {t('getStartedForm.success.goToDashboard')}
                  </Link>
                </Button>
              )}
            </div>

            {/* Enhanced Mobile Navigation */}
            <div className="lg:hidden ml-2">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <MenuIcon size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  hideCloseButton
                  side={isMobile ? 'bottom' : "right"}
                  className="w-full md:w-80 p-0"
                >
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                      <LogoLink />
                    </div>
                    <SheetClose asChild>
                      <Button variant="ghost" size="sm">
                        <XIcon size={20} />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col p-6 space-y-2">
                    {navigation.map((item, index) => (
                      <Button
                        variant="ghost"
                        size="lg"
                        key={item.name}
                        className="w-full justify-start text-left transition-all duration-200 hover:translate-x-2"
                        asChild
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </Button>
                    ))}
                  </div>

                  {/* Mobile CTA Section */}
                  <div className="p-6 border-t bg-accent/20">
                    {status === 'authenticated' ? (
                      <Button asChild className="w-full" size="lg">
                        <Link href="/dashboard">
                          <LayoutDashboardIcon size={16} className="mr-2" />
                          {t('getStartedForm.success.goToDashboard')}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full" size="lg">
                        <Link href="/get-started">
                          {t('getStarted')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}