import { getT } from "@/features/core/i18n/server";

// TODO(launch): these are placeholder academy names, not real customers —
// swap for a real logo strip once academies exist, or drop this section
// entirely if there aren't enough by launch. Tracked in docs/rebuild/STATE.md.
const placeholderAcademies = [
  "Sunrise Academy",
  "Northgate Institute",
  "CodeCraft Academy",
  "Lingua House",
  "Bright Minds",
  "Mathworks Academy",
];

export async function LogosSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-center font-bold text-muted-foreground text-xs uppercase tracking-wider">
        {t("landing.logos.eyebrow")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70 grayscale">
        {placeholderAcademies.map((name) => (
          <span
            key={name}
            className="font-display font-semibold text-muted-foreground"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
