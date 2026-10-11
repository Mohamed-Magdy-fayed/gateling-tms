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
import { useTranslation } from "@/features/core/i18n/client";
import type { BranchRow } from "@/features/core/organizations/server/branches";
import {
  type UpdateBranchInput,
  updateBranchSchema,
} from "@/features/core/organizations/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type BranchFormDialogProps = {
  /** The branch to edit; null opens the dialog in "add" mode. */
  branch: BranchRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// One form for add and edit. Adding validates with the update schema minus
// the id, so both modes share field rules.
const branchFormSchema = updateBranchSchema.omit({ branchId: true });
type BranchFormValues = Omit<UpdateBranchInput, "branchId">;

export function BranchFormDialog({
  branch,
  open,
  onOpenChange,
}: BranchFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMut = useMutation(
    trpc.organizations.branches.create.mutationOptions(),
  );
  const updateMut = useMutation(
    trpc.organizations.branches.update.mutationOptions(),
  );

  const defaultValues = useMemo<BranchFormValues>(
    () => ({
      name: branch?.name ?? "",
      address: branch?.address ?? "",
      phone: branch?.phone ?? "",
      isActive: branch?.isActive ?? true,
    }),
    [branch],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: branchFormSchema },
    onSubmit: async ({ value }) => {
      const save: Promise<unknown> = branch
        ? updateMut.mutateAsync({ ...value, branchId: branch.id })
        : createMut.mutateAsync(value);
      try {
        await toast
          .promise(save, {
            loading: t("common.loading"),
            success: t("organizations.branches.saved"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("organizations.branches.saveFailed"),
          })
          .unwrap();
        // Branch names show in the switcher and in every list's Branch column.
        await queryClient.invalidateQueries({
          queryKey: trpc.organizations.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the dialog opens, not on every form identity change
  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, defaultValues]);

  const pending = createMut.isPending || updateMut.isPending;
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
          <DialogTitle>
            {branch
              ? t("organizations.branches.editTitle")
              : t("organizations.branches.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("organizations.branches.formDescription")}
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
                    label={t("organizations.branches.nameLabel")}
                    autoFocus
                  />
                )}
              </form.AppField>
              <form.AppField name="address">
                {(field) => (
                  <field.StringField
                    label={t("organizations.branches.addressLabel")}
                  />
                )}
              </form.AppField>
              <form.AppField name="phone">
                {(field) => (
                  <field.StringField
                    label={t("organizations.branches.phoneLabel")}
                    inputType="tel"
                  />
                )}
              </form.AppField>
              {/* New branches start active; the switch only matters later. */}
              {branch ? (
                <form.AppField name="isActive">
                  {(field) => (
                    <field.BooleanField
                      label={t("organizations.branches.activeLabel")}
                      description={t("organizations.branches.activeHint")}
                    />
                  )}
                </form.AppField>
              ) : null}
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
