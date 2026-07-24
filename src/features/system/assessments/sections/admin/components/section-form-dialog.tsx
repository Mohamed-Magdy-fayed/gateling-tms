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
import type { FormSection } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { sectionMutationSchema } from "@/features/system/assessments/sections/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";

type SectionFormDialogProps = {
  formId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  section?: FormSection | null;
};

export function SectionFormDialog({
  formId,
  onOpenChange,
  open,
  section,
}: SectionFormDialogProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = section != null;

  const createMut = useMutation(trpc.sections.create.mutationOptions());
  const updateMut = useMutation(trpc.sections.update.mutationOptions());

  const defaultValues = useMemo(
    () => ({ formId, title: section?.title ?? "" }),
    [formId, section],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: sectionMutationSchema },
    onSubmit: async ({ value }) => {
      const action: Promise<unknown> =
        isEdit && section
          ? updateMut.mutateAsync({ id: section.id, title: value.title })
          : createMut.mutateAsync(value);

      try {
        await toast
          .promise(action, {
            loading: t("common.loading"),
            success: t(isEdit ? "sections.updated" : "sections.created"),
            error: (err) =>
              err instanceof Error ? err.message : t("sections.saveFailed"),
          })
          .unwrap();

        await queryClient.invalidateQueries({
          queryKey: trpc.sections.pathKey(),
        });
        onOpenChange(false);
      } catch {
        // toast.promise already surfaced the failure.
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: form/defaultValues are deliberately excluded — this should only re-run when the dialog opens for a (possibly different) section, not on every defaultValues/form identity change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, section?.id]);

  const pending = createMut.isPending || updateMut.isPending;
  const SubmitIcon = pending ? Loader2Icon : isEdit ? SaveIcon : PlusIcon;
  const formId_ = useId();

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
            {t(isEdit ? "sections.edit" : "sections.add")}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? "sections.editDescription" : "sections.addDescription")}
          </DialogDescription>
        </DialogHeader>

        <OverlayFormBody
          formId={formId_}
          className="space-y-4"
          onSubmit={handleBodySubmit}
        >
          <FieldSet disabled={pending}>
            <FieldGroup>
              <form.AppField name="title">
                {(field) => (
                  <field.StringField label={t("sections.name")} autoFocus />
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
            <OverlayFormSubmitButton formId={formId_} disabled={pending}>
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
