'use client';

import { ThemeProvider } from 'next-themes';
import { TranslationProvider } from '@/i18n/useTranslation';
import en from '@/i18n/global/en';
import ar from '@/i18n/global/ar';
import { TRPCReactProvider } from '@/trpc/react';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <Suspense>
            <SessionProvider>
                <TranslationProvider
                    fallbackLocale={["en"]}
                    translations={{
                        en,
                        ar,
                    }}
                >
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Toaster />
                        <NuqsAdapter>
                            <TRPCReactProvider>{children}</TRPCReactProvider>
                        </NuqsAdapter>
                    </ThemeProvider>
                </TranslationProvider>
            </SessionProvider>
        </Suspense>
    );
}

