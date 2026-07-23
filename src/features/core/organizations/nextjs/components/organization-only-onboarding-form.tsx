"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldSet } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import { organizationOnlySchema } from "@/features/core/organizations/nextjs/get-started-schema";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * The org-creation half of get-started for a user who already has an
 * account (OAuth-first entry, or a returning user whose org creation failed
 * the first time — see complete-onboarding.ts's doc comment). Reuses the
 * existing `organizations.create` mutation instead of a bespoke action.
 */
export function OrganizationOnlyOnboardingForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();

  const createMutation = useMutation(trpc.organizations.create.mutationOptions());

  const form = useAppForm({
    defaultValues: { businessName: "" },
    validators: { onSubmit: organizationOnlySchema },
    onSubmit: async ({ value }) => {
      try {
        await createMutation.mutateAsync({ name: value.businessName });
        router.push("/dashboard");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("errors.generic"),
        );
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("getStarted.orgOnly.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldSet disabled={createMutation.isPending}>
            <form.AppField name="businessName">
              {({ StringField }) => (
                <StringField label={t("getStarted.step1.businessNameLabel")} />
              )}
            </form.AppField>
          </FieldSet>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={createMutation.isPending || isSubmitting}
                className="w-full"
              >
                <LoadingSwap
                  isLoading={createMutation.isPending || isSubmitting}
                  loadingText={t("getStarted.step2.submitting")}
                >
                  <CheckCircle2Icon />
                  {t("getStarted.step2.submit")}
                </LoadingSwap>
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
