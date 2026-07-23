"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldSet } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { completeOnboardingAction } from "@/features/core/organizations/nextjs/actions/complete-onboarding";
import { getStartedSchema } from "@/features/core/organizations/nextjs/get-started-schema";
import { useTranslation } from "@/features/core/i18n/client";

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function GetStartedWizard() {
  const { t } = useTranslation();
  const [step, setStep] = useState<"details" | "review">("details");
  const [isPending, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      contactName: "",
      businessName: "",
      email: "",
      phone: "",
      password: "",
    },
    validators: { onSubmit: getStartedSchema },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        try {
          await completeOnboardingAction(value);
        } catch (error) {
          if (isNextRedirectError(error)) throw error;
          toast.error(
            error instanceof Error ? error.message : t("errors.generic"),
          );
        }
      });
    },
  });

  async function handleNext() {
    const errors = await form.validateAllFields("submit");
    if (errors.length === 0) setStep("review");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === "details"
            ? t("getStarted.step1.title")
            : t("getStarted.step2.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "details") {
              void handleNext();
              return;
            }
            form.handleSubmit();
          }}
        >
          {step === "details" ? (
            <FieldSet
              className="grid gap-4 md:grid-cols-2"
              disabled={isPending}
            >
              <form.AppField name="contactName">
                {({ StringField }) => (
                  <StringField label={t("getStarted.step1.contactNameLabel")} />
                )}
              </form.AppField>
              <form.AppField name="businessName">
                {({ StringField }) => (
                  <StringField
                    label={t("getStarted.step1.businessNameLabel")}
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {({ EmailField }) => (
                  <EmailField label={t("getStarted.step1.emailLabel")} />
                )}
              </form.AppField>
              <form.AppField name="phone">
                {({ StringField }) => (
                  <StringField
                    inputType="tel"
                    label={t("getStarted.step1.phoneLabel")}
                  />
                )}
              </form.AppField>
              <div className="md:col-span-2">
                <form.AppField name="password">
                  {({ PasswordField }) => (
                    <PasswordField
                      label={t("getStarted.step1.passwordLabel")}
                    />
                  )}
                </form.AppField>
              </div>
            </FieldSet>
          ) : (
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <dl className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">
                      {t("getStarted.step1.contactNameLabel")}
                    </dt>
                    <dd className="font-medium">{values.contactName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("getStarted.step1.businessNameLabel")}
                    </dt>
                    <dd className="font-medium">{values.businessName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("getStarted.step1.emailLabel")}
                    </dt>
                    <dd className="font-medium">{values.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("getStarted.step1.phoneLabel")}
                    </dt>
                    <dd className="font-medium">{values.phone}</dd>
                  </div>
                </dl>
              )}
            </form.Subscribe>
          )}

          <div className="flex items-center justify-between gap-2">
            {step === "review" ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setStep("details")}
              >
                <ArrowLeftIcon />
                {t("common.back")}
              </Button>
            ) : (
              <span />
            )}

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="ms-auto"
                >
                  <LoadingSwap
                    isLoading={isPending || isSubmitting}
                    loadingText={t("getStarted.step2.submitting")}
                  >
                    {step === "details" ? (
                      <>
                        {t("common.next")}
                        <ArrowRightIcon />
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon />
                        {t("getStarted.step2.submit")}
                      </>
                    )}
                  </LoadingSwap>
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
