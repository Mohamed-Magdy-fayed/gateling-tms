"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InfoIcon, Loader2Icon, PlugZapIcon, XIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useTranslation } from "@/features/core/i18n/client";
import {
  type ConnectMeetingAccountInput,
  connectMeetingAccountSchema,
} from "@/features/system/live-classes/meeting-accounts/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type MeetingAccountConnectDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Signs in to onMeeting and records every room the account owns.
 *
 * onMeeting has no OAuth, so this asks for the admin's own onMeeting password
 * directly — which is why the dialog says out loud what happens to it. The
 * value is submitted once and never stored (STATE.md D146); the form is reset
 * on every open so it can't linger in a re-opened dialog either.
 */
export function MeetingAccountConnectDialog({
  onOpenChange,
  open,
}: MeetingAccountConnectDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const connectMut = useMutation(
    trpc.meetingAccounts.connect.mutationOptions(),
  );

  const defaultValues = useMemo<ConnectMeetingAccountInput>(
    () => ({ name: "", email: "", password: "" }),
    [],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: connectMeetingAccountSchema },
    onSubmit: async ({ value }) => {
      try {
        const result = await connectMut.mutateAsync(value);
        await queryClient.invalidateQueries({
          queryKey: trpc.meetingAccounts.pathKey(),
        });
        toast.success(
          t("meetingAccounts.connectedRooms", { count: result.connected }),
        );
        // Clear the submitted password from component state as soon as the
        // request that used it has returned, rather than leaving it in memory
        // until the dialog happens to be re-opened.
        form.reset(defaultValues);
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("meetingAccounts.connectFailed"),
        );
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open]);

  const pending = connectMut.isPending || form.state.isSubmitting;
  const SubmitIcon = pending ? Loader2Icon : PlugZapIcon;
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
          <DialogTitle>{t("meetingAccounts.connect")}</DialogTitle>
          <DialogDescription>
            {t("meetingAccounts.connectDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <Alert>
            <InfoIcon />
            <AlertDescription>
              {t("meetingAccounts.passwordNotice")}
            </AlertDescription>
          </Alert>

          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.StringField
                    label={t("meetingAccounts.name")}
                    description={t("meetingAccounts.nameDescription")}
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.EmailField
                    label={t("meetingAccounts.email")}
                    description={t("meetingAccounts.emailDescription")}
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.PasswordField
                    label={t("meetingAccounts.password")}
                    description={t("meetingAccounts.passwordDescription")}
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
              <SubmitIcon
                className={pending ? "size-3.5 animate-spin" : "size-3.5"}
              />
              {t("meetingAccounts.connectAction")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
