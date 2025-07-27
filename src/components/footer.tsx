'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';
import { H3, P } from '@/components/ui/typography';
import { APP_CONFIG } from '@/constants';
import { useTranslation } from '@/i18n/useTranslation';
import LogoLink from './general/logo-link';
export function Footer() {
  const { t } = useTranslation();

  const navigation = {
    services: [
      { name: t("footer.navigation.gettingStarted.gettingStarted"), href: "/get-started" },
      { name: t("footer.navigation.gettingStarted.trainingResources"), href: "/guides" },
      { name: t("footer.navigation.gettingStarted.integrations"), href: "/integrations" },
      { name: t("footer.navigation.gettingStarted.tutorials"), href: "/tutorials" },
      { name: t("footer.navigation.gettingStarted.documentation"), href: "/documentation" },
    ],
    company: [
      { name: t("footer.navigation.company.aboutUs"), href: "/about" },
      { name: t("footer.navigation.company.ourProcess"), href: "#process" },
      { name: t("footer.navigation.company.portfolio"), href: "/portfolio" },
      { name: t("footer.navigation.company.testimonials"), href: "#testimonials" },
      { name: t("footer.navigation.company.blog"), href: "/blog" },
    ],
    resources: [
      { name: t("footer.navigation.resources.features"), href: "/features" },
      { name: t("footer.navigation.resources.pricing"), href: "/pricing" },
      { name: t("footer.navigation.resources.faq"), href: "/faq" },
      { name: t("footer.navigation.resources.support"), href: "/support" },
      { name: t("footer.navigation.resources.contact"), href: "/contact" },
    ],

  };

  const socialLinks = [
    { name: "Facebook", href: APP_CONFIG.facebook, icon: FacebookIcon },
    { name: "Youtube", href: APP_CONFIG.youtube, icon: YoutubeIcon },
    { name: "LinkedIn", href: APP_CONFIG.linkedin, icon: LinkedinIcon },
    { name: "Instagram", href: APP_CONFIG.instagram, icon: InstagramIcon },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <LogoLink />

              <P className="text-muted-foreground mb-6 max-w-md mt-0">
                {t("footer.companyInfo.description")}
              </P>

              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <Link href={`mailto:${APP_CONFIG.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {APP_CONFIG.email}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <Link href={`https://wa.me/${APP_CONFIG.phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {APP_CONFIG.phone}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {t("footer.companyInfo.location")}
                  </span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-4 mt-6">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <social.icon className="h-4 w-4 scale-100" />
                    <span className="sr-only">{social.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div>
              <H3 className="text-foreground mb-4 border-none pb-0">{t("footer.navigation.gettingStarted.title")}</H3>
              <ul className="space-y-3">
                {navigation.services.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <H3 className="text-foreground mb-4 border-none pb-0">{t("footer.navigation.company.title")}</H3>
              <ul className="space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <H3 className="text-foreground mb-4 border-none pb-0">{t("footer.navigation.resources.title")}</H3>
              <ul className="space-y-3 mb-6">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Newsletter signup */}
              <div className="bg-background rounded-lg p-4 border border-border/50">
                <H3 className="text-sm mb-2 border-none pb-0">{t("footer.newsletter.title")}</H3>
                <P className="text-xs text-muted-foreground mb-3 mt-0">
                  {t("footer.newsletter.description")}
                </P>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder={t("footer.newsletter.placeholder")}
                    className="flex-1 min-w-0 px-3 py-2 text-xs bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button className="px-3 py-2 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors">
                    {t("footer.newsletter.subscribeButton")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <FooterCopywrite />
      </div>
    </footer>
  );
}

export function FooterCopywrite() {
  const { t } = useTranslation();

  const legalLinks = [
    { name: t("footer.navigation.legal.privacyPolicy"), href: "/privacy" },
    { name: t("footer.navigation.legal.termsOfService"), href: "/terms" },
    { name: t("footer.navigation.legal.cookiePolicy"), href: "/cookies" },
    { name: t("footer.navigation.legal.refundPolicy"), href: "/refund" },
  ]

  return (
    <div className="py-6 border-t border-border/50">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <P className="text-sm text-muted-foreground mt-0">
          {t("footer.copyright", { year: new Date(), appName: APP_CONFIG.name })}
        </P>

        <div className="flex items-center gap-6">
          {legalLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
