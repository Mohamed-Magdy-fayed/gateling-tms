import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/features/core/i18n/server";

const steps = ["signUp", "setUp", "addClasses", "teach"] as const;

export async function ProcessSection() {
  const { t } = await getT();

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold text-primary text-xs uppercase tracking-wider">
            {t("landing.process.eyebrow")}
          </p>
          <h2 className="mt-2 font-display font-bold text-3xl text-foreground">
            {t("landing.process.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("landing.process.subtitle")}
          </p>
        </div>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="relative">
              <span className="-top-4 start-6 absolute z-10 flex size-9 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground text-sm shadow-[var(--shadow-brand-sm)]">
                {index + 1}
              </span>
              <Card className="h-full pt-6 transition-shadow duration-300 hover:shadow-lg">
                <CardContent className="space-y-2">
                  <h3 className="font-display font-semibold text-foreground">
                    {t(`landing.process.steps.${step}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`landing.process.steps.${step}.description`)}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
