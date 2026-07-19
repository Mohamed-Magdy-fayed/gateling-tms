import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/features/core/i18n/client";

type ProvidersProps = PropsWithChildren<{
  locale: string;
}>;

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <TranslationProvider defaultLocale={locale} fallbackLocale="en">
      <TooltipProvider>
        {children}
        <Toaster visibleToasts={3} />
      </TooltipProvider>
    </TranslationProvider>
  );
}
