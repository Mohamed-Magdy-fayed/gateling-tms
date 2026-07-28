"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
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
  type PlacementTestMutationInput,
  placementTestMutationSchema,
} from "@/features/system/learning-flow/placement-tests/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type PlacementTestAssignDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  traineeId: string;
};

export function PlacementTestAssignDialog({
  onOpenChange,
  open,
  traineeId,
}: PlacementTestAssignDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMut = useMutation(trpc.placementTests.create.mutationOptions());

  // Only published placement forms can be assigned — the server enforces the
  // same two conditions, this just keeps the picker from offering rejects.
  const { data: forms } = useQuery({
    ...trpc.forms.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
      type: "placement",
      status: "published",
    }),
    enabled: open,
  });

  const defaultValues = useMemo<PlacementTestMutationInput>(
    () => ({ traineeId, formId: "", scheduledAt: null }),
    [traineeId],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: placementTestMutationSchema },
    onSubmit: async ({ value }) => {
      try {
        await toast
          .promise(createMut.mutateAsync(value), {
            loading: t("common.loading"),
            success: t("placementTests.assigned"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("placementTests.assignFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.placementTests.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) trainee
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, traineeId]);

  const pending = createMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : PlusIcon;
  const formId = useId();

  const handleBodySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form],
  );

  const formOptions = useMemo(
    () =>
      (forms?.rows ?? []).map((row) => ({
        value: row.id,
        label: row.title,
      })),
    [forms],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("placementTests.assign")}</DialogTitle>
          <DialogDescription>
            {t("placementTests.assignDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              {formOptions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("placementTests.noPlacementForms")}
                </p>
              ) : (
                <form.AppField name="formId">
                  {(field) => (
                    <field.SelectField
                      label={t("placementTests.form")}
                      options={formOptions}
                    />
                  )}
                </form.AppField>
              )}
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
            <OverlayFormSubmitButton
              formId={formId}
              disabled={pending || formOptions.length === 0}
            >
              <SubmitIcon
                className={pending ? "size-3.5 animate-spin" : "size-3.5"}
              />
              {t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
