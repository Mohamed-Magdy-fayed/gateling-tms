import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuth } from "@/features/core/auth/nextjs/actions";
import { AuthProvider } from "@/features/core/auth/nextjs/components/auth-provider";
import { TranslationProvider } from "@/features/core/i18n/client";
import { TRPCReactProvider } from "@/integrations/trpc/client";

type ProvidersProps = PropsWithChildren<{
  locale: string;
  /**
   * Per-request CSP nonce (src/proxy.ts). `next-themes` injects a blocking
   * inline `<script>` to set the theme class before first paint; without the
   * nonce, `script-src` blocks it and every visitor gets a flash of the wrong
   * theme on load.
   */
  nonce?: string;
}>;

export async function Providers({ children, locale, nonce }: ProvidersProps) {
  const user = await getAuth();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      nonce={nonce}
    >
      <TranslationProvider defaultLocale={locale} fallbackLocale="en">
        <TRPCReactProvider>
          <TooltipProvider>
            <AuthProvider value={user}>
              {children}
              <Toaster visibleToasts={3} />
            </AuthProvider>
          </TooltipProvider>
        </TRPCReactProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
