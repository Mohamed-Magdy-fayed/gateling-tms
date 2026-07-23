import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/features/core/i18n/client";
import { TRPCReactProvider } from "@/integrations/trpc/client";

type ProvidersProps = PropsWithChildren<{
  locale: string;
}>;

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TranslationProvider defaultLocale={locale} fallbackLocale="en">
        <TRPCReactProvider>
          <TooltipProvider>
            {children}
            <Toaster visibleToasts={3} />
          </TooltipProvider>
        </TRPCReactProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
