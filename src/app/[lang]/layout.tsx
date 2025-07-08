import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { APP_CONFIG } from "@/constants";
import type translations from "@/i18n/global/en"
import { Providers } from "@/components/providers";
import { locales, type Locale } from "@/i18n/lib";

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: [
    'online teaching',
    'website development',
    'web design',
    'academy management',
    'business applications',
  ],
  authors: [
    {
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
  ],
  creator: APP_CONFIG.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_CONFIG.url,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    creator: `@${APP_CONFIG.name.toLowerCase()}`,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/site.webmanifest',
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export async function generateStaticParams() {
  return locales.map(locale => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode, params: Promise<{ lang: Locale }> }>) {
  const { lang } = await params

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`${geist.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

declare module "@/i18n/lib/my-translations" {
  interface Register {
    translations: typeof translations
  }
}
