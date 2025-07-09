'use client';

import { ThemeProvider } from 'next-themes';
import { TranslationProvider } from '@/i18n/useTranslation';
import en from '@/i18n/global/en';
import ar from '@/i18n/global/ar';
import { TRPCReactProvider } from '@/trpc/react';
import { Toaster } from 'sonner';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
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
                <TRPCReactProvider>{children}</TRPCReactProvider>
            </ThemeProvider>
        </TranslationProvider>
    );
}

