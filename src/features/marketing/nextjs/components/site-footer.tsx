import { getT } from "@/features/core/i18n/server";
import { SiteLogo } from "./site-logo";

export async function SiteFooter() {
  const { t } = await getT();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6 lg:px-8">
        <SiteLogo />
        <p className="max-w-md text-muted-foreground text-sm">
          {t("landing.footer.tagline")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("landing.footer.copyright", {
            year: String(new Date().getFullYear()),
          })}
        </p>
      </div>
    </footer>
  );
}
