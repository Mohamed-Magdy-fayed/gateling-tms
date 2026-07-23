import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { getT } from "@/features/core/i18n/server";

export async function TestimonialSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-center font-bold text-primary text-xs uppercase tracking-wider">
        {t("landing.testimonial.eyebrow")}
      </p>
      {/*
        TODO(launch): placeholder testimonial (no real customers pre-launch) —
        replace with a real quote once one exists, or drop this section.
        Tracked in docs/rebuild/STATE.md.
      */}
      <Card className="relative mt-6 overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 px-8 py-12 sm:px-14 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-16 -top-20 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="font-display font-semibold text-2xl text-white leading-snug sm:text-3xl">
            {t("landing.testimonial.quote")}
          </p>
          <div className="mt-7 flex items-center gap-3">
            <Avatar className="size-11 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white">
                {t("landing.testimonial.initials")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-sm text-white">
                {t("landing.testimonial.name")}
              </div>
              <div className="text-orange-100 text-xs">
                {t("landing.testimonial.role")}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
