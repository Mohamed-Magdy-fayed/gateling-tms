"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlugZapIcon, XIcon } from "lucide-react";
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
import { useTranslation } from "@/features/core/i18n/client";
import {
  type ZoomClientMutationInput,
  zoomClientMutationSchema,
} from "@/features/system/live-classes/zoom-clients/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type ZoomClientCreateDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/**
 * Names the connection, then hands the browser to `/api/zoom/connect/[id]`,
 * which is what sets the state cookie and bounces to Zoom's consent screen.
 * The row exists in `pending` from this point on, so an admin who abandons
 * the Zoom screen comes back to a row they can retry rather than nothing.
 */
export function ZoomClientCreateDialog({
  onOpenChange,
  open,
}: ZoomClientCreateDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMut = useMutation(trpc.zoomClients.create.mutationOptions());

  const defaultValues = useMemo<ZoomClientMutationInput>(
    () => ({ name: "" }),
    [],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: zoomClientMutationSchema },
    onSubmit: async ({ value }) => {
      try {
        const created = await createMut.mutateAsync(value);
        await queryClient.invalidateQueries({
          queryKey: trpc.zoomClients.pathKey(),
        });
        window.location.href = `/api/zoom/connect/${created.id}`;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("zoomClients.connectFailed"),
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

  const pending = createMut.isPending || form.state.isSubmitting;
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
          <DialogTitle>{t("zoomClients.connect")}</DialogTitle>
          <DialogDescription>
            {t("zoomClients.connectDescription")}
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
                    label={t("zoomClients.name")}
                    description={t("zoomClients.nameDescription")}
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
              {t("zoomClients.continueToZoom")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
