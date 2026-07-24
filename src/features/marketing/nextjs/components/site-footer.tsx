import Link from "next/link";
import { getT } from "@/features/core/i18n/server";
import { SiteLogo } from "./site-logo";

export async function SiteFooter() {
  const { t } = await getT();

  const quickLinks = [
    { href: "/features", label: t("landing.header.features") },
    { href: "/pricing", label: t("landing.header.pricing") },
    { href: "/get-started", label: t("landing.header.getStarted") },
    { href: "/auth/sign-in", label: t("landing.header.signIn") },
  ];

  const legalLinks = [
    { href: "/about", label: t("landing.footer.links.about") },
    { href: "/contact", label: t("landing.footer.links.contact") },
    { href: "/privacy", label: t("landing.footer.links.privacy") },
    { href: "/terms", label: t("landing.footer.links.terms") },
    { href: "/cookies", label: t("landing.footer.links.cookies") },
    { href: "/refund", label: t("landing.footer.links.refund") },
  ];

  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 text-neutral-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-12 text-center sm:px-6 md:flex-row md:items-start md:justify-between md:text-start lg:px-8">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <SiteLogo className="text-white" />
          <p className="max-w-md text-neutral-400 text-sm">
            {t("landing.footer.tagline")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-10 sm:flex-row md:items-start">
          <div>
            <div className="font-display font-bold text-sm text-white">
              {t("landing.footer.linksHeading")}
            </div>
            <ul className="mt-3 flex flex-col items-center gap-2 md:items-start">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-display font-bold text-sm text-white">
              {t("landing.footer.legalHeading")}
            </div>
            <ul className="mt-3 flex flex-col items-center gap-2 md:items-start">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-400 text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-neutral-800 border-t">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-neutral-500 text-xs sm:px-6 lg:px-8">
          {t("landing.footer.copyright", {
            year: String(new Date().getFullYear()),
          })}
        </p>
      </div>
    </footer>
  );
}
