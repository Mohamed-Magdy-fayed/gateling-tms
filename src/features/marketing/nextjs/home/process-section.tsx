import { getT } from "@/features/core/i18n/server";

const steps = ["signUp", "setUp", "addClasses", "teach"] as const;

export async function ProcessSection() {
  const { t } = await getT();

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display font-bold text-3xl text-foreground">
            {t("landing.process.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("landing.process.subtitle")}
          </p>
        </div>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="space-y-2 text-center sm:text-start">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="font-display font-semibold text-foreground">
                {t(`landing.process.steps.${step}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t(`landing.process.steps.${step}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
