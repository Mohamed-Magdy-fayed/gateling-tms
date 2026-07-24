import { CircleCheckIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/features/core/i18n/server";

const faqKeys = ["q1", "q2", "q3"] as const;

export async function PricingFaqSection() {
  const { t } = await getT();

  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display font-bold text-3xl text-foreground">
            {t("pricing.faq.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("pricing.faq.description")}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqKeys.map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleCheckIcon className="size-4 shrink-0 text-primary" />
                  {t(`pricing.faq.questions.${key}.question`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t(`pricing.faq.questions.${key}.answer`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
