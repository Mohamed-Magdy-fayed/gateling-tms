import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

/**
 * The names of real academies that consented to be named, or nothing.
 *
 * These used to be six invented academy names under a "Trusted by academies
 * everywhere" heading — the third of D56's fabricated-social-proof spots. It now
 * reads from the same consent as the hero band (`organizations.publicShowcaseConsentAt`),
 * so an empty database renders no section at all rather than a claim about
 * customers that don't exist.
 */
export async function LogosSection() {
  const { t } = await getT();
  const showcase = await (await api()).testimonials.showcase();

  if (showcase.academies.length === 0) return null;

  return (
    <section className="mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-center font-bold text-muted-foreground text-xs uppercase tracking-wider">
        {t("landing.logos.eyebrow")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70 grayscale">
        {showcase.academies.map((academy) => (
          <span
            key={academy.name}
            className="font-display font-semibold text-muted-foreground"
          >
            {academy.name}
          </span>
        ))}
      </div>
    </section>
  );
}
