"use client";

import { useMutation } from "@tanstack/react-query";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type ContactMessageInput,
  contactMessageSchema,
} from "@/features/marketing/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

const DEFAULT_VALUES: ContactMessageInput = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const submitMut = useMutation(trpc.contact.submit.mutationOptions());

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: contactMessageSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(submitMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("contact.form.success"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("contact.form.error.submitFailed"),
          })
          .unwrap();
        form.reset(DEFAULT_VALUES);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  const pending = submitMut.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">
          {t("contact.form.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.StringField label={t("contact.form.nameLabel")} />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.EmailField label={t("contact.form.emailLabel")} />
                )}
              </form.AppField>
              <form.AppField name="subject">
                {(field) => (
                  <field.StringField label={t("contact.form.subjectLabel")} />
                )}
              </form.AppField>
              <form.AppField name="message">
                {(field) => (
                  <field.TextareaField
                    label={t("contact.form.messageLabel")}
                    rows={5}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </FieldSet>

          <Button className="w-full" disabled={pending} type="submit">
            <LoadingSwap
              isLoading={pending}
              loadingText={t("contact.form.submitting")}
            >
              <SendIcon />
              {t("contact.form.submit")}
            </LoadingSwap>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
