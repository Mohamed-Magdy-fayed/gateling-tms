"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
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
import type { DemoItem } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type DemoItemMutationInput,
  demoItemMutationSchema,
} from "@/features/system/demo/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type DemoItemFormDialogProps = {
  item?: DemoItem | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DemoItemFormDialog({
  item,
  onOpenChange,
  open,
}: DemoItemFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = item != null;

  const createMut = useMutation(trpc.demo.create.mutationOptions());
  const updateMut = useMutation(trpc.demo.update.mutationOptions());

  const defaultValues = useMemo<DemoItemMutationInput>(
    () => ({
      name: item?.name ?? "",
      isActive: item?.isActive ?? true,
    }),
    [item],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: demoItemMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && item
          ? updateMut.mutateAsync({ id: item.id, ...value })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(
              isEdit
                ? "systemPages.demoItemUpdated"
                : "systemPages.demoItemCreated",
            ),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("systemPages.demoItemSaveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({ queryKey: trpc.demo.pathKey() });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) item, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, item?.id]);

  const pending = createMut.isPending || updateMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : isEdit ? SaveIcon : PlusIcon;
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
            {t(isEdit ? "systemPages.editDemoItem" : "systemPages.addDemoItem")}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEdit
                ? "systemPages.editDemoItemDescription"
                : "systemPages.addDemoItemDescription",
            )}
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
                    label={t("systemPages.demoItemName")}
                    autoFocus
                  />
                )}
              </form.AppField>

              <form.AppField name="isActive">
                {(field) => (
                  <field.BooleanField label={t("systemPages.demoItemActive")} />
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
              {isEdit ? t("actions.save") : t("actions.create")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
