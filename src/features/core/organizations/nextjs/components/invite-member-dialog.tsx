"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MailPlusIcon, XIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId } from "react";
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
import { organizationMembershipRoleValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type InviteMemberInput,
  inviteMemberSchema,
} from "@/features/core/organizations/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type InviteMemberDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const DEFAULT_VALUES: InviteMemberInput = { email: "", role: "student" };

export function InviteMemberDialog({
  onOpenChange,
  open,
}: InviteMemberDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const inviteMut = useMutation(
    trpc.organizations.members.invite.mutationOptions(),
  );

  const roleOptions = organizationMembershipRoleValues.map((role) => ({
    value: role,
    label: t(`organizations.members.role.${role}`),
  }));

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onSubmit: inviteMemberSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(inviteMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("organizations.members.inviteSent"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("organizations.members.inviteFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.organizations.members.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form is deliberately excluded — this should only re-run when the dialog opens
  useEffect(() => {
    if (open) form.reset(DEFAULT_VALUES);
  }, [open]);

  const pending = inviteMut.isPending;
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
          <DialogTitle>{t("organizations.members.inviteTitle")}</DialogTitle>
          <DialogDescription>
            {t("organizations.members.inviteDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="email">
                {(field) => (
                  <field.EmailField
                    label={t("organizations.members.inviteEmailLabel")}
                    autoFocus
                  />
                )}
              </form.AppField>
              <form.AppField name="role">
                {(field) => (
                  <field.SelectField
                    label={t("organizations.members.inviteRoleLabel")}
                    options={roleOptions}
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
                <MailPlusIcon className="size-3.5" />
              )}
              {t("organizations.members.inviteButton")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
