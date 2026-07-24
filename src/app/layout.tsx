import type { Metadata } from "next";
import { Fredoka, JetBrains_Mono, Nunito } from "next/font/google";
import { Providers } from "@/app/_providers";
import { baseUrl } from "@/data/env/server";
import { getLocaleCookie } from "@/features/core/i18n/server";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      "Gateling-TMS — Your gateway to manage your online teaching business",
    template: "%s | Gateling-TMS",
  },
  description: "A gateway to manage your online teaching business",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gateling-TMS",
  url: baseUrl,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gateling-TMS",
  url: baseUrl,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleCookie();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fredoka.variable} ${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Static, agent-authored JSON-LD — no user input, safe to inline. */}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static constant object, not user-derived
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static constant object, not user-derived
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
