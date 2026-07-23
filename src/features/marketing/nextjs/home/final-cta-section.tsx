import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT } from "@/features/core/i18n/server";

export async function FinalCtaSection() {
  const { t } = await getT();

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h2 className="font-display font-bold text-3xl text-foreground sm:text-4xl">
        {t("landing.finalCta.title")}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        {t("landing.finalCta.subtitle")}
      </p>
      <div className="mt-8">
        <Button size="lg" render={<Link href="/get-started" />}>
          {t("landing.finalCta.cta")}
        </Button>
      </div>
    </section>
  );
}
