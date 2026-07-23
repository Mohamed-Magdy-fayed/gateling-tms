"use client";

import { LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageToggle, useTranslation } from "@/features/core/i18n/client";
import { cn } from "@/lib/utils";
import { SiteLogo } from "./site-logo";

type SiteHeaderProps = {
  isAuthenticated: boolean;
};

export function SiteHeader({ isAuthenticated }: SiteHeaderProps) {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        isScrolled
          ? "border-border bg-background/80 shadow-sm backdrop-blur-md"
          : "border-transparent bg-background/60 backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteLogo />

        <div className="flex items-center gap-2">
          <LanguageToggle />

          {isAuthenticated ? (
            <Button render={<Link href="/dashboard" />}>
              <LayoutDashboardIcon />
              {t("landing.header.dashboard")}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                render={<Link href="/auth/sign-in" />}
              >
                {t("landing.header.signIn")}
              </Button>
              <Button render={<Link href="/get-started" />}>
                {t("landing.header.getStarted")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
