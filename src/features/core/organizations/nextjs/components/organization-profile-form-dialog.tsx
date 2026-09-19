"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import type { Organization } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type OrganizationProfileInput,
  organizationProfileSchema,
} from "@/features/core/organizations/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * Every IANA zone the runtime knows, which is what the server validates
 * against — a hardcoded shortlist would drift and would exclude academies the
 * product hasn't anticipated. Computed once at module scope; the list is
 * static for the life of the process.
 */
const timeZoneOptions = (
  Intl.supportedValuesOf?.("timeZone") ?? ["UTC", "Africa/Cairo"]
).map((zone) => ({ value: zone, label: zone.replace(/_/g, " ") }));

// Every ISO 4217 code the runtime can format, labelled with its own name
// where the browser knows one ("EGP — Egyptian Pound"). Depends on the
// locale, so it is built per locale below rather than at module scope.
function buildCurrencyOptions(locale: string) {
  const codes = Intl.supportedValuesOf?.("currency") ?? ["EGP", "USD"];
  const names =
    typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames([locale], { type: "currency" })
      : null;
  return codes.map((code) => {
    const name = names?.of(code);
    return {
      value: code,
      label: name && name !== code ? `${code} — ${name}` : code,
    };
  });
}

type OrganizationProfileFormDialogProps = {
  organization: Pick<
    Organization,
    "name" | "businessName" | "phone" | "website" | "timeZone" | "currency"
  >;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function OrganizationProfileFormDialog({
  organization,
  onOpenChange,
  open,
}: OrganizationProfileFormDialogProps) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMut = useMutation(trpc.organizations.update.mutationOptions());

  const defaultValues = useMemo<OrganizationProfileInput>(
    () => ({
      name: organization.name,
      businessName: organization.businessName ?? "",
      phone: organization.phone ?? "",
      website: organization.website ?? "",
      timeZone: organization.timeZone,
      currency: organization.currency,
    }),
    [organization],
  );

  const currencyOptions = useMemo(() => buildCurrencyOptions(locale), [locale]);

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: organizationProfileSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(updateMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("organizations.profile.saveSuccess"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("organizations.profile.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.organizations.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open]);

  const pending = updateMut.isPending;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("organizations.profile.editTitle")}</DialogTitle>
          <DialogDescription>
            {t("organizations.profile.editDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.StringField
                    label={t("organizations.profile.nameLabel")}
                    autoFocus
                  />
                )}
              </form.AppField>
              <form.AppField name="businessName">
                {(field) => (
                  <field.StringField
                    label={t("organizations.profile.businessNameLabel")}
                  />
                )}
              </form.AppField>
              <form.AppField name="phone">
                {(field) => (
                  <field.StringField
                    label={t("organizations.profile.phoneLabel")}
                  />
                )}
              </form.AppField>
              <form.AppField name="website">
                {(field) => (
                  <field.StringField
                    label={t("organizations.profile.websiteLabel")}
                  />
                )}
              </form.AppField>

              <form.AppField name="timeZone">
                {(field) => (
                  <field.ComboboxOneField
                    label={t("organizations.profile.timeZoneLabel")}
                    description={t("organizations.profile.timeZoneHint")}
                    options={timeZoneOptions}
                  />
                )}
              </form.AppField>

              <form.AppField name="currency">
                {(field) => (
                  <field.ComboboxOneField
                    label={t("organizations.profile.currencyLabel")}
                    description={t("organizations.profile.currencyHint")}
                    options={currencyOptions}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </FieldSet>
        </OverlayFormBody>

        <DialogFooter>
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" />
              {t("actions.cancel")}
            </Button>
            <OverlayFormSubmitButton formId={formId} disabled={pending}>
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              {t("actions.save")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
