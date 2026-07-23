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

type OrganizationProfileFormDialogProps = {
  organization: Pick<
    Organization,
    "name" | "businessName" | "phone" | "website"
  >;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function OrganizationProfileFormDialog({
  organization,
  onOpenChange,
  open,
}: OrganizationProfileFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMut = useMutation(trpc.organizations.update.mutationOptions());

  const defaultValues = useMemo<OrganizationProfileInput>(
    () => ({
      name: organization.name,
      businessName: organization.businessName ?? "",
      phone: organization.phone ?? "",
      website: organization.website ?? "",
    }),
    [organization],
  );

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
